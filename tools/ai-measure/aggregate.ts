// Turn the raw responses saved by measure.ts into per-answer source lists and a domain ranking.
//
//   NODE_USE_ENV_PROXY=1 node tools/ai-measure/aggregate.ts --run bis-hanoi-2026-11-12 [--top 10]
//
// Writes results/<run>/answers.json (one row per answer: text, cited URLs, retrieved URLs) and
// results/<run>/summary.json + report.md (domain ranking, per-model and generic/branded breakdowns).
//
// Two URL sets are kept for every answer:
//   cited     - URLs the answer itself points to (inline citations: OpenAI/xAI url_citation
//               annotations, Claude text-block citations, Gemini grounding chunks referenced by
//               groundingSupports, Perplexity url_citation annotations).
//   retrieved - every URL the model's search returned (OpenAI/xAI web_search_call sources,
//               Claude web_search_result blocks, all Gemini grounding chunks, Perplexity
//               search_results).
// The ranking uses "sources": the cited set when the answer has inline citations, otherwise the
// retrieved set (Perplexity's own UI shows search_results as the answer's sources, and Claude
// sometimes answers without inline citations). Each answer records which basis was used.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
type Any = any; // raw provider JSON

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

// Two-level public suffixes seen for schools and media in the region; extend as needed.
const TWO_LEVEL = new Set([
  "com.vn", "edu.vn", "org.vn", "net.vn", "gov.vn", "co.uk", "org.uk", "ac.uk", "com.au", "edu.au",
  "co.in", "co.kr", "or.kr", "ac.kr", "com.sg", "edu.sg", "co.jp", "com.hk", "edu.hk", "co.th", "ac.th", "com.my", "edu.my", "ac.in", "co.nz",
]);
export function domainOf(url: string): string | null {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  const parts = host.replace(/^www\d?\./, "").split(".");
  if (parts.length <= 2) return parts.join(".");
  const last2 = parts.slice(-2).join(".");
  return TWO_LEVEL.has(last2) ? parts.slice(-3).join(".") : last2;
}

// Gemini grounding URIs are vertexaisearch redirect links; resolve to the real site.
const redirectCache = new Map<string, string>();
async function resolveGemini(uri: string, title?: string, domain?: string): Promise<string> {
  if (!/vertexaisearch\.cloud\.google\.com|grounding-api-redirect/.test(uri)) return uri;
  if (domain) return `https://${domain}/`;
  if (redirectCache.has(uri)) return redirectCache.get(uri)!;
  let out = title && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(title) ? `https://${title}/` : uri;
  try {
    const res = await fetch(uri, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(20_000) });
    const loc = res.headers.get("location");
    if (loc) out = loc;
  } catch {
    /* keep title-based fallback */
  }
  redirectCache.set(uri, out);
  return out;
}

type Extracted = { text: string; cited: string[]; retrieved: string[] };

async function extract(provider: string, response: Any): Promise<Extracted> {
  const cited: string[] = [];
  const retrieved: string[] = [];
  let text = "";
  if (provider === "openai" || provider === "xai" || provider === "perplexity") {
    for (const item of response.output ?? []) {
      if (item.type === "message") {
        for (const c of item.content ?? []) {
          text += c.text ?? "";
          for (const a of c.annotations ?? []) if (a.type === "url_citation" && a.url) cited.push(a.url);
        }
      } else if (item.type === "web_search_call") {
        for (const s of item.action?.sources ?? []) if (s.url) retrieved.push(s.url);
      } else if (item.type === "search_results") {
        for (const r of item.results ?? []) if (r.url) retrieved.push(r.url);
      }
    }
  } else if (provider === "anthropic") {
    for (const turn of response.turns ?? []) {
      for (const b of turn.content ?? []) {
        if (b.type === "text") {
          text += b.text;
          for (const c of b.citations ?? []) if (c.url) cited.push(c.url);
        } else if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
          for (const r of b.content) if (r.url) retrieved.push(r.url);
        }
      }
    }
  } else if (provider === "gemini") {
    const chunks: Any[] = response.chunks ?? [response];
    let gm: Any = null;
    for (const ch of chunks) {
      const cand = ch.candidates?.[0];
      for (const p of cand?.content?.parts ?? []) if (p.text && !p.thought) text += p.text;
      if (cand?.groundingMetadata?.groundingChunks) gm = cand.groundingMetadata;
    }
    const urls: string[] = [];
    for (const c of gm?.groundingChunks ?? []) urls.push(await resolveGemini(c.web?.uri ?? "", c.web?.title, c.web?.domain));
    retrieved.push(...urls);
    for (const s of gm?.groundingSupports ?? []) for (const i of s.groundingChunkIndices ?? []) if (urls[i]) cited.push(urls[i]);
  }
  return { text, cited, retrieved };
}

type Row = {
  provider: string; model: string; question_id: string; question_type: string; question: string;
  ok: boolean; error?: string; text?: string; basis?: "cited" | "retrieved" | "none";
  cited?: string[]; retrieved?: string[]; sources?: string[];
};

async function main() {
  const run = arg("run");
  if (!run) throw new Error("--run <folder under results/> is required");
  const top = Number(arg("top") ?? 10);
  const runDir = path.join(here, "results", run);
  const rawDir = path.join(runDir, "raw");
  const typesPath = path.join(here, "domain-types.json");
  const types: Record<string, string> = existsSync(typesPath) ? JSON.parse(readFileSync(typesPath, "utf8")) : {};

  const rows: Row[] = [];
  for (const f of readdirSync(rawDir).filter((f) => f.endsWith(".json")).sort()) {
    const r = JSON.parse(readFileSync(path.join(rawDir, f), "utf8"));
    const base = { provider: r.provider, model: r.model, question_id: r.question.id, question_type: r.question.type, question: r.question.text, ok: r.ok };
    if (!r.ok) {
      rows.push({ ...base, error: r.error });
      continue;
    }
    const e = await extract(r.provider, r.response);
    const basis = e.cited.length ? "cited" : e.retrieved.length ? "retrieved" : "none";
    // Inline citations count every occurrence; a retrieved list counts each URL once.
    const sources = basis === "cited" ? e.cited : [...new Set(e.retrieved)];
    rows.push({ ...base, text: e.text, basis, cited: e.cited, retrieved: [...new Set(e.retrieved)], sources });
  }
  writeFileSync(path.join(runDir, "answers.json"), JSON.stringify(rows, null, 2));

  type Agg = { answers: Set<string>; citations: number; providers: Record<string, number>; generic: number; branded: number; retrievedAnswers: Set<string> };
  const agg = new Map<string, Agg>();
  const get = (d: string) => {
    if (!agg.has(d)) agg.set(d, { answers: new Set(), citations: 0, providers: {}, generic: 0, branded: 0, retrievedAnswers: new Set() });
    return agg.get(d)!;
  };
  for (const r of rows.filter((r) => r.ok)) {
    const key = `${r.provider}:${r.question_id}`;
    const seen = new Set<string>();
    for (const u of r.sources ?? []) {
      const d = domainOf(u);
      if (!d) continue;
      const a = get(d);
      a.citations++;
      if (!seen.has(d)) {
        seen.add(d);
        a.answers.add(key);
        a.providers[r.provider] = (a.providers[r.provider] ?? 0) + 1;
        if (r.question_type === "branded") a.branded++;
        else a.generic++;
      }
    }
    for (const u of r.retrieved ?? []) {
      const d = domainOf(u);
      if (d) get(d).retrievedAnswers.add(key);
    }
  }
  const ranking = [...agg.entries()]
    .filter(([, a]) => a.answers.size > 0)
    .map(([domain, a]) => ({
      domain, type: types[domain] ?? "미분류", answers_citing: a.answers.size, total_citations: a.citations,
      generic_answers: a.generic, branded_answers: a.branded, by_provider: a.providers, answers_retrieving: a.retrievedAnswers.size,
    }))
    .sort((x, y) => y.answers_citing - x.answers_citing || y.total_citations - x.total_citations || x.domain.localeCompare(y.domain));

  const ok = rows.filter((r) => r.ok);
  const coverage = Object.fromEntries(
    [...new Set(rows.map((r) => r.provider))].map((p) => {
      const pr = rows.filter((r) => r.provider === p);
      return [p, {
        model: [...new Set(pr.map((r) => r.model))].join(", "),
        answered: pr.filter((r) => r.ok).length, failed: pr.filter((r) => !r.ok).map((r) => r.question_id),
        basis: Object.fromEntries(["cited", "retrieved", "none"].map((b) => [b, pr.filter((r) => r.basis === b).length])),
        mean_sources_per_answer: +(pr.filter((r) => r.ok).reduce((s, r) => s + (r.sources?.length ?? 0), 0) / Math.max(1, pr.filter((r) => r.ok).length)).toFixed(1),
      }];
    }),
  );
  const summary = { run, generated: new Date().toISOString(), answers_ok: ok.length, answers_total: rows.length, coverage, ranking };
  writeFileSync(path.join(runDir, "summary.json"), JSON.stringify(summary, null, 2));

  // Markdown report
  const provs = Object.keys(coverage);
  const lines: string[] = [];
  lines.push(`# AI 인용 출처 측정: ${run}`, "");
  lines.push(`성공 답변 ${ok.length} / 전체 ${rows.length}`, "");
  lines.push("| 모델 | 모델 ID | 성공 | 실패 질문 | 근거 기준(인라인/검색결과/없음) | 답변당 출처 수 |", "|---|---|---|---|---|---|");
  for (const [p, c] of Object.entries(coverage)) {
    lines.push(`| ${p} | ${c.model} | ${c.answered} | ${c.failed.join(", ") || "-"} | ${c.basis.cited}/${c.basis.retrieved}/${c.basis.none} | ${c.mean_sources_per_answer} |`);
  }
  lines.push("", `## 상위 ${top} 도메인 (인용 답변 수 기준)`, "");
  lines.push(`| 순위 | 도메인 | 유형 | 인용 답변 수 | 총 인용 수 | 일반 | 브랜드 | ${provs.join(" | ")} |`);
  lines.push(`|---|---|---|---|---|---|---|${provs.map(() => "---").join("|")}|`);
  ranking.slice(0, top).forEach((r, i) => {
    lines.push(`| ${i + 1} | ${r.domain} | ${r.type} | ${r.answers_citing} | ${r.total_citations} | ${r.generic_answers} | ${r.branded_answers} | ${provs.map((p) => r.by_provider[p] ?? 0).join(" | ")} |`);
  });
  lines.push("", "## 전체 도메인", "", "| 도메인 | 유형 | 인용 답변 수 | 총 인용 수 | 일반 | 브랜드 |", "|---|---|---|---|---|---|");
  for (const r of ranking) lines.push(`| ${r.domain} | ${r.type} | ${r.answers_citing} | ${r.total_citations} | ${r.generic_answers} | ${r.branded_answers} |`);
  // The school's own pages (config own_url_patterns, matched as substrings of the URL).
  const run_ = JSON.parse(readFileSync(path.join(runDir, "run.json"), "utf8"));
  const cfgPath = path.join(here, run_.config);
  const patterns: string[] = existsSync(cfgPath) ? (JSON.parse(readFileSync(cfgPath, "utf8")).own_url_patterns ?? []) : [];
  if (patterns.length) {
    lines.push("", `## ${run_.school} 자체 페이지 인용 (${patterns.join(", ")})`, "");
    lines.push("| 모델 | 일반 질문 | 브랜드 질문 |", "|---|---|---|");
    for (const p of provs) {
      const cell = (t: string) => {
        const rs = ok.filter((r) => r.provider === p && r.question_type === t);
        const hit = rs.filter((r) => (r.sources ?? []).some((u) => patterns.some((pt) => u.includes(pt))));
        return rs.length ? `${hit.length}/${rs.length}` : "-";
      };
      lines.push(`| ${p} | ${cell("generic")} | ${cell("branded")} |`);
    }
  }
  // Which schools each answer names (config mention_schools: name -> regex list), and where the
  // first mention sits in the answer (1 = named before any other listed school).
  const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf8")) : {};
  const mentionSchools: Record<string, string[]> = cfg.mention_schools ?? {};
  if (Object.keys(mentionSchools).length) {
    const res = Object.entries(mentionSchools).map(([name, pats]) => [name, pats.map((p) => new RegExp(p, "i"))] as const);
    const mentions = ok.map((r) => {
      const text = r.text ?? "";
      const firstPos: Record<string, number> = {};
      for (const [name, regs] of res) {
        const pos = Math.min(...regs.map((re) => { const m = re.exec(text); return m ? m.index : Infinity; }));
        if (pos !== Infinity) firstPos[name] = pos;
      }
      const order = Object.entries(firstPos).sort((a, b) => a[1] - b[1]).map(([n]) => n);
      return { provider: r.provider, question_id: r.question_id, question_type: r.question_type, order };
    });
    const generic = mentions.filter((m) => m.question_type === "generic");
    const table = res.map(([name]) => {
      const hit = generic.filter((m) => m.order.includes(name));
      const ranks = hit.map((m) => m.order.indexOf(name) + 1);
      return {
        school: name,
        generic_answers_mentioning: hit.length,
        generic_answers_total: generic.length,
        mention_rate: +(hit.length / Math.max(1, generic.length)).toFixed(3),
        mean_order_when_mentioned: ranks.length ? +(ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(1) : null,
        named_first: hit.filter((m) => m.order[0] === name).length,
        by_provider: Object.fromEntries(provs.map((p) => [p, hit.filter((m) => m.provider === p).length])),
        by_question: Object.fromEntries([...new Set(generic.map((m) => m.question_id))].sort().map((q) => [q, hit.filter((m) => m.question_id === q).length])),
      };
    }).sort((a, b) => b.generic_answers_mentioning - a.generic_answers_mentioning);
    writeFileSync(path.join(runDir, "mentions.json"), JSON.stringify({ per_answer: mentions, generic_share: table }, null, 2));
    lines.push("", `## 일반 질문 답변에서 학교 언급 (${generic.length}개 답변)`, "");
    lines.push(`| 학교 | 언급 답변 | 언급률 | 평균 언급 순서 | 가장 먼저 언급 | ${provs.join(" | ")} |`);
    lines.push(`|---|---|---|---|---|${provs.map(() => "---").join("|")}|`);
    for (const t of table) {
      lines.push(`| ${t.school} | ${t.generic_answers_mentioning} | ${(t.mention_rate * 100).toFixed(0)}% | ${t.mean_order_when_mentioned ?? "-"} | ${t.named_first} | ${provs.map((p) => t.by_provider[p]).join(" | ")} |`);
    }
  }
  const failed = rows.filter((r) => !r.ok);
  if (failed.length) {
    lines.push("", "## 빠진 답변", "");
    for (const r of failed) lines.push(`- ${r.provider} ${r.question_id}: ${(r.error ?? "").split("\n")[0]?.slice(0, 160)}`);
  }
  writeFileSync(path.join(runDir, "report.md"), lines.join("\n") + "\n");
  console.log(lines.slice(0, 22 + top).join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
