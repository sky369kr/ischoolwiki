export interface FactRow {
  id: number;
  key: string;
  value: string;
  unit: string | null;
  source_url: string;
  quote?: string | null;
}

export interface ArticleDraft {
  title: string;
  tldr: string;
  body_md: string;
  faq: { question: string; answer: string }[];
}

export interface VerifyContext {
  lang: string;
  school: { name: string; city: string; country: string };
  facts: FactRow[];
  entities: string[];
  priorArticles: { id: number; title: string; body_md: string }[];
  now: Date;
}

export type Problem =
  | { kind: "empty"; detail: string }
  | { kind: "unsupported_number"; detail: string }
  | { kind: "unknown_entity"; detail: string }
  | { kind: "duplicate"; detail: string }
  | { kind: "unsupported_claim"; detail: string };

export interface VerifyResult {
  passed: boolean;
  problems: Problem[];
  usedFactIds: number[];
}

const DUPLICATE_THRESHOLD = 0.3;
const MIN_BODY_CHARS = 600;

// Terms an article may use without a source row: curricula, accreditors, languages, calendar words.
const GENERIC_PROPER = new Set(
  [
    "IB", "IBDP", "DP", "MYP", "PYP", "CP", "IGCSE", "GCSE", "A-Level", "A-Levels", "AP", "SAT", "ACT", "EAL",
    "STEAM", "STEM", "CIS", "WASC", "COBIS", "BSO", "CAS", "TOK", "EE", "FAQ", "UK", "US", "USA",
    "International", "Baccalaureate", "Diploma", "Programme", "Program", "Primary", "Middle", "Years",
    "Year", "Grade", "Key", "Stage", "Early", "Secondary", "Sixth", "Form", "British", "American",
    "English", "Mandarin", "Chinese", "Korean", "Vietnamese", "Japanese", "Spanish", "French", "German",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October",
    "November", "December", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    "Asia", "Europe", "Nord", "Anglia", "Education", "Oxbridge", "Ivy", "League", "Russell", "Group",
    "City",
    // ISO currency codes and common aliases; the amounts next to them are still checked as numbers.
    "RMB", "CNY", "USD", "EUR", "GBP", "HKD", "SGD", "KRW", "JPY", "VND", "THB", "MYR", "IDR", "PHP", "TWD",
  ].map((w) => w.toLowerCase()),
);

export function verifyArticle(draft: ArticleDraft, ctx: VerifyContext): VerifyResult {
  const problems: Problem[] = [];
  const text = articleText(draft);

  if (draft.body_md.trim().length < MIN_BODY_CHARS) {
    problems.push({ kind: "empty", detail: `body is ${draft.body_md.trim().length} chars, minimum ${MIN_BODY_CHARS}` });
  }

  const { unsupported, usedFactIds } = checkNumbers(text, ctx);
  for (const n of unsupported) {
    problems.push({ kind: "unsupported_number", detail: `"${n.raw}" in "${n.context}" matches no fact` });
  }

  if (ctx.lang === "en") {
    for (const e of unknownEntities(text, ctx)) {
      problems.push({ kind: "unknown_entity", detail: `"${e}" is not a known name for this school` });
    }
  }

  for (const p of ctx.priorArticles) {
    if (normalizeTitle(p.title) === normalizeTitle(draft.title)) {
      problems.push({ kind: "duplicate", detail: `same title as article ${p.id}` });
      continue;
    }
    const sim = jaccard(shingles(draft.body_md), shingles(p.body_md));
    if (sim >= DUPLICATE_THRESHOLD) {
      problems.push({ kind: "duplicate", detail: `body overlaps article ${p.id} (similarity ${sim.toFixed(2)})` });
    }
  }

  return { passed: problems.length === 0, problems, usedFactIds };
}

function articleText(d: ArticleDraft): string {
  return [d.title, d.tldr, d.body_md, ...d.faq.flatMap((f) => [f.question, f.answer])].join("\n");
}

// Markdown list and heading markers ("1.", "##") are structure, not claims. Table rows become one
// line per cell, so each cell starts like a sentence; separator rows ("|---|") disappear.
function stripMarkdownStructure(text: string): string {
  return text
    .split("\n")
    .flatMap((line) => (/^\s*\|/.test(line) ? line.split("|").filter((c) => !/^\s*:?-*:?\s*$/.test(c)) : [line]))
    .map((line) => line.replace(/^\s*(#{1,6}\s+|\d+[.)]\s+|[-*+]\s+)/, ""))
    .join("\n")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
}

const NUMBER_RE = /\d[\d,]*(?:\.\d+)?/g;

function numberTokens(s: string): string[] {
  return (s.match(NUMBER_RE) ?? []).map((t) => t.replace(/,/g, "").replace(/\.0+$/, ""));
}

function checkNumbers(text: string, ctx: VerifyContext) {
  const factNumbers = new Map<string, number[]>();
  for (const f of ctx.facts) {
    for (const t of numberTokens(`${f.value} ${f.unit ?? ""}`)) {
      const ids = factNumbers.get(t) ?? [];
      ids.push(f.id);
      factNumbers.set(t, ids);
    }
  }
  const year = ctx.now.getUTCFullYear();
  const allowedYears = new Set([String(year), String(year + 1)]);

  const unsupported: { raw: string; context: string }[] = [];
  const used = new Set<number>();
  const clean = stripMarkdownStructure(text);
  for (const m of clean.matchAll(NUMBER_RE)) {
    const token = m[0].replace(/,/g, "").replace(/\.0+$/, "");
    const ids = factNumbers.get(token);
    if (ids) {
      ids.forEach((id) => used.add(id));
      continue;
    }
    if (allowedYears.has(token)) continue;
    const at = m.index ?? 0;
    unsupported.push({ raw: m[0], context: clean.slice(Math.max(0, at - 30), at + m[0].length + 30).replace(/\s+/g, " ").trim() });
  }
  return { unsupported, usedFactIds: [...used] };
}

function allowedWords(ctx: VerifyContext): Set<string> {
  const words = new Set(GENERIC_PROPER);
  const add = (s: string) => {
    for (const w of s.split(/[^\p{L}\p{N}'’&-]+/u)) if (w) words.add(w.toLowerCase());
  };
  add(ctx.school.name);
  add(ctx.school.city);
  add(ctx.school.country);
  ctx.entities.forEach(add);
  ctx.facts.forEach((f) => add(`${f.value} ${f.unit ?? ""}`));
  return words;
}

const CONNECTORS = new Set(["of", "and", "the", "for", "de", "&", "at", "in"]);

// Words that open questions and sentences ("Does BSB Shunyi ...?", "The ...", "On October 31 ..."). At the start of a
// sentence they are never part of a name, so the name after them is checked on its own.
const SENTENCE_OPENERS = new Set(
  [
    "a", "an", "the", "do", "does", "did", "is", "are", "was", "were", "can", "could", "will", "would",
    "should", "may", "must", "has", "have", "had", "what", "when", "where", "which", "who", "whom",
    "whose", "why", "how", "if", "yes", "no", "this", "these", "that", "those", "its", "their",
    "on", "during", "after", "before", "from", "since", "by", "with", "until", "for", "at", "in",
  ],
);

// A word passes when every capitalized piece of it is known: "American-style" and "P.R." are
// checked as "American" and "P", "R". A lowercase piece ("style") is not a name.
function isKnownWord(w: string, allowed: Set<string>): boolean {
  const lw = w.toLowerCase();
  if (CONNECTORS.has(lw) || allowed.has(lw)) return true;
  const parts = w.split(/[.\-]+/).filter(Boolean);
  if (parts.length < 2) return false;
  return parts.every((p) => !isCapitalized(p) || allowed.has(p.toLowerCase()));
}

// Sentence-initial words are skipped (they are capitalized anyway), so a lone invented
// name at the very start of a sentence is not caught; the prompt asks for sentence-case
// headings so that headings are checked like prose.
export function unknownEntities(text: string, ctx: VerifyContext): string[] {
  const allowed = allowedWords(ctx);
  const found = new Set<string>();
  const clean = stripMarkdownStructure(text);
  for (const sentence of clean.split(/(?<=[.!?:;])\s+|\n+/)) {
    const words = sentence.split(/\s+/).filter(Boolean);
    let run: string[] = [];
    const flush = () => {
      while (run.length && CONNECTORS.has(run[run.length - 1]!.toLowerCase())) run.pop();
      const bad = run.filter((w) => isCapitalized(bare(w)) && !isKnownWord(bare(w), allowed));
      if (bad.length) found.add(run.map(bare).join(" "));
      run = [];
    };
    words.forEach((raw, i) => {
      const w = bare(raw);
      if (!w) return flush();
      if (i === 0 && (SENTENCE_OPENERS.has(w.toLowerCase()) || !(words[1] && isCapitalized(bare(words[1]))))) return;
      if (isCapitalized(w)) run.push(raw);
      else if (run.length && CONNECTORS.has(w.toLowerCase())) run.push(raw);
      else flush();
      if (/[,()"“”]$/.test(raw)) flush();
    });
    flush();
  }
  return [...found];
}

function bare(w: string): string {
  return w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").replace(/['’]s$/, "");
}

function isCapitalized(w: string): boolean {
  return /^\p{Lu}/u.test(w);
}

function normalizeTitle(t: string): string {
  return t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function shingles(text: string, n = 5): Set<string> {
  const words = text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(" "));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}
