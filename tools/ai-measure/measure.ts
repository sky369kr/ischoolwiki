// Ask each question of five AI models with web search on, and save every raw response.
//
//   NODE_USE_ENV_PROXY=1 node tools/ai-measure/measure.ts --config tools/ai-measure/schools/bis-hanoi.json
//
// Options:
//   --config <file>        school + questions (see schools/*.json)
//   --run <name>           run folder name under results/ (default: <slug>-<YYYY-MM-DD>)
//   --providers a,b        subset of: openai,gemini,perplexity,anthropic,xai
//   --questions g01,b02    subset of question ids
//   --models gemini=gemini-3.5-flash,openai=gpt-6-sol   override default model IDs
//
// A call that already has a saved successful response in the run folder is skipped, so re-running
// the same command only retries what failed and never pays twice for the same answer.
//
// Credentials: OpenAI, xAI and Perplexity are authenticated by the environment's proxy (no header
// is sent from here). Gemini reads GOOGLE_AI_API_KEY (sent as x-goog-api-key). Anthropic reads
// ANTHROPIC_API_KEY, or ISCHOOLWIKI_ANTHROPIC_KEY in cloud sessions that filter the former out.
// Keys are never written to disk or printed.

import Anthropic from "@anthropic-ai/sdk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const MODELS: Record<string, string> = {
  openai: "gpt-6-astra",
  gemini: "gemini-3.8-flash",
  perplexity: "perplexity/sonar",
  anthropic: "claude-opus-5-5",
  xai: "grok-4.7",
};
export type Provider = "openai" | "gemini" | "perplexity" | "anthropic" | "xai";
const ALL_PROVIDERS = Object.keys(MODELS) as Provider[];

type Question = { id: string; type: "generic" | "branded"; text: string };
type Config = { school: string; slug: string; questions: Question[] };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function postJson(url: string, body: unknown, headers: Record<string, string> = {}, timeoutMs = 300_000) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { non_json_body: text.slice(0, 2000) };
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(json).slice(0, 800)}`);
  return { request: body, response: json };
}

// The environment's proxy drops a request that sends nothing back for about 30 seconds, and a
// search-backed answer often takes longer, so the slow providers are called with streaming.
// Returns the parsed `data:` payloads of the server-sent events in order.
async function postSse(url: string, body: unknown, headers: Record<string, string> = {}, timeoutMs = 600_000) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/event-stream", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 800)}`);
  const text = await res.text();
  const events: unknown[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      events.push(JSON.parse(data));
    } catch {
      events.push({ unparsed: data.slice(0, 500) });
    }
  }
  return events;
}

// Responses API (OpenAI, xAI) streamed: the final `response.completed` event holds the whole response.
async function responsesStream(url: string, body: Record<string, unknown>) {
  const events = (await postSse(url, { ...body, stream: true })) as { type?: string; response?: unknown }[];
  const done = events.find((e) => e.type === "response.completed");
  if (!done) {
    const last = events.filter((e) => e.type === "response.failed" || e.type === "error" || e.type === "response.incomplete");
    throw new Error(`no response.completed event: ${JSON.stringify(last).slice(0, 800)}`);
  }
  return { request: body, response: done.response };
}

// Each caller returns { request, response } with the provider's raw response body.
const callers: Record<Provider, (q: string) => Promise<{ request: unknown; response: unknown }>> = {
  // Responses API + web_search; include asks for every consulted source, not only inline citations.
  openai: (q) =>
    responsesStream("https://api.openai.com/v1/responses", {
      model: MODELS.openai,
      tools: [{ type: "web_search" }],
      tool_choice: "auto",
      include: ["web_search_call.action.sources"],
      input: q,
    }),

  // generateContent (streamed) + google_search; sources are in candidates[].groundingMetadata.
  // The response saved is the list of streamed GenerateContentResponse chunks.
  gemini: async (q) => {
    const key = process.env.GOOGLE_AI_API_KEY;
    if (!key) throw new Error("GOOGLE_AI_API_KEY is not set");
    const body = { contents: [{ role: "user", parts: [{ text: q }] }], tools: [{ google_search: {} }] };
    const chunks = await postSse(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:streamGenerateContent?alt=sse`,
      body,
      { "x-goog-api-key": key },
    );
    const err = chunks.find((c) => (c as { error?: unknown }).error);
    if (err) throw new Error(`stream error: ${JSON.stringify(err).slice(0, 800)}`);
    return { request: body, response: { chunks } };
  },

  // Agent API + web_search tool; output has search_results items and url_citation annotations.
  perplexity: (q) =>
    postJson("https://api.perplexity.ai/v1/agent", {
      model: MODELS.perplexity,
      input: q,
      tools: [{ type: "web_search" }],
    }),

  // Messages API + server-side web search. Continues pause_turn up to 5 times.
  anthropic: async (q) => {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ISCHOOLWIKI_ANTHROPIC_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY / ISCHOOLWIKI_ANTHROPIC_KEY is not set");
    const client = new Anthropic({ apiKey });
    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: q }];
    const request = {
      model: MODELS.anthropic,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default" as const,
      tools: [{ type: "web_search_20260209" as const, name: "web_search" as const }],
    };
    const turns: unknown[] = [];
    for (let i = 0; i < 6; i++) {
      const msg = await client.beta.messages.stream({ ...request, messages }).finalMessage();
      turns.push(msg);
      if (msg.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: msg.content });
    }
    return { request: { ...request, messages: [{ role: "user", content: q }] }, response: { turns } };
  },

  // Responses API + web_search tool.
  xai: (q) =>
    responsesStream("https://api.x.ai/v1/responses", {
      model: MODELS.xai,
      input: [{ role: "user", content: q }],
      tools: [{ type: "web_search" }],
    }),
};

async function main() {
  for (const pair of arg("models")?.split(",") ?? []) {
    const [p, m] = pair.split("=");
    if (!p || !m || !(p in MODELS)) throw new Error(`bad --models entry: ${pair}`);
    MODELS[p] = m;
  }
  const configPath = arg("config");
  if (!configPath) throw new Error("--config <file> is required");
  const config = JSON.parse(readFileSync(configPath, "utf8")) as Config;
  const runName = arg("run") ?? `${config.slug}-${new Date().toISOString().slice(0, 10)}`;
  const rawDir = path.join(here, "results", runName, "raw");
  mkdirSync(rawDir, { recursive: true });
  const providers = (arg("providers")?.split(",") as Provider[] | undefined) ?? ALL_PROVIDERS;
  const qIds = arg("questions")?.split(",");
  const questions = config.questions.filter((q) => !qIds || qIds.includes(q.id));

  writeFileSync(
    path.join(here, "results", runName, "run.json"),
    JSON.stringify({ school: config.school, config: path.relative(here, configPath), models: MODELS, questions: config.questions }, null, 2),
  );

  await Promise.all(
    providers.map(async (p) => {
      for (const q of questions) {
        const file = path.join(rawDir, `${p}__${q.id}.json`);
        if (existsSync(file) && JSON.parse(readFileSync(file, "utf8")).ok) {
          console.log(`skip  ${p} ${q.id} (already saved)`);
          continue;
        }
        const started = new Date().toISOString();
        let record: Record<string, unknown>;
        try {
          const { request, response } = await callers[p](q.text);
          record = { ok: true, provider: p, model: MODELS[p], question: q, started, finished: new Date().toISOString(), request, response };
          console.log(`ok    ${p} ${q.id}`);
        } catch (e) {
          record = { ok: false, provider: p, model: MODELS[p], question: q, started, finished: new Date().toISOString(), error: String(e) };
          console.log(`FAIL  ${p} ${q.id}: ${String(e).slice(0, 300)}`);
        }
        writeFileSync(file, JSON.stringify(record, null, 2));
      }
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
