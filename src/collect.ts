import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { MODEL, RefusedError } from "./generate";

export interface FeedItem {
  url: string;
  title: string;
  summary: string | null;
  published_at: string | null;
}

export function parseFeed(xml: string): FeedItem[] {
  const blocks = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  return blocks.flatMap((b) => {
    const title = tag(b, "title");
    const url = tag(b, "link") || (b.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? "");
    if (!title || !/^https?:\/\//.test(url)) return [];
    const date = tag(b, "pubDate") || tag(b, "published") || tag(b, "updated");
    const parsed = date ? new Date(date) : null;
    return [{
      url,
      title,
      summary: tag(b, "description") || tag(b, "summary") || null,
      published_at: parsed && !isNaN(parsed.getTime()) ? parsed.toISOString() : null,
    }];
  });
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  if (!m) return "";
  return decodeEntities(m[1]!.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}

export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|nav|footer|header|noscript)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+/g, " ").trim();
}

const ExtractionSchema = z.object({
  facts: z.array(z.object({ key: z.string(), value: z.string(), unit: z.string(), quote: z.string() })),
  names: z.array(z.object({ name: z.string(), quote: z.string() })),
});

const EXTRACT_SYSTEM = `You extract verifiable facts about one school from a page the school published.
Return only facts the page states outright about this school: results, enrolment, fees, programmes offered, admissions, awards, campus changes, dates.
For each fact give a snake_case key, the value exactly as written on the page, a unit (empty string if none), and quote: the exact sentence or phrase from the page that states it, copied character for character.
Also list proper names the page mentions in connection with the school (programmes, universities graduates entered, named facilities, partners), each with its exact quote.
Leave out opinions, marketing claims ("world-class"), and anything about other schools. An empty list is a correct answer.`;

export interface ExtractedFact { key: string; value: string; unit: string | null; quote: string }

export async function extractFacts(apiKey: string, schoolName: string, pageText: string) {
  const stream = new Anthropic({ apiKey }).beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: zodOutputFormat(ExtractionSchema) },
    system: [{ type: "text", text: EXTRACT_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: `School: ${schoolName}\n\nPage text:\n${pageText}` }],
  });
  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") throw new RefusedError("model declined extraction");
  if (message.stop_reason === "max_tokens") throw new Error("extraction hit max_tokens");
  const raw = ExtractionSchema.parse(JSON.parse(message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("")));
  return filterGrounded(raw, pageText);
}

// The model's word is not enough: a fact is kept only if its quote is on the page and contains the value.
export function filterGrounded(raw: z.infer<typeof ExtractionSchema>, pageText: string) {
  const page = squash(pageText);
  const facts: ExtractedFact[] = raw.facts
    .filter((f) => f.value.trim() && page.includes(squash(f.quote)) && squash(f.quote).includes(squash(f.value)))
    .map((f) => ({ key: f.key, value: f.value.trim(), unit: f.unit.trim() || null, quote: f.quote }));
  const names = raw.names
    .filter((n) => n.name.trim() && page.includes(squash(n.quote)) && squash(n.quote).includes(squash(n.name)))
    .map((n) => n.name.trim());
  return { facts, names: [...new Set(names)] };
}

function squash(s: string): string {
  return s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/\s+/g, " ").trim().toLowerCase();
}
