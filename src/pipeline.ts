import { articleHtml, extractFacts, htmlToText, parseNewsSource } from "./collect";
import { MODEL, reviseArticle, translateArticle, writeArticle } from "./generate";
import { checkGrounding } from "./grounding";
import { pickGuideTopic, type GuideTopic } from "./guides";
import { fetchIsppMaster, importIsppFacts } from "./ispp";
import { dateNumbers, publishedDateNumbers, verifyArticle, type ArticleDraft, type FactRow, type Problem } from "./verify";

export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  ADMIN_TOKEN: string;
  ALERT_WEBHOOK_URL?: string;
  SITE_URL: string;
  SITE_NAME: string;
  MAX_POSTS_PER_SCHOOL_PER_MONTH: string;
  AUTO_PUBLISH: string;
}

export interface School {
  slug: string;
  name: string;
  city: string;
  city_slug: string;
  country: string;
  website: string | null;
  news_feed: string | null;
  is_client: number;
  ispp_school_id: string | null;
}

export interface RunReport {
  run_id: string;
  ispp: string[];
  schools: { slug: string; steps: string[] }[];
}

const USER_AGENT = "iSchoolWikiBot/0.1 (+https://ischoolwiki.com)";
const TRANSLATE_TO: Record<string, string> = { ko: "Korean" };
const EXTRACT_PER_RUN = 3;
// Runs a news page may fail with a temporary error before it is given up as having no facts.
const MAX_PAGE_ATTEMPTS = 3;
// News items one article may draw on; each is marked used once written about. Fewer per article
// spreads a school's news over more, shorter articles.
const NEWS_PER_ARTICLE = 3;
const PAGE_CHAR_LIMIT = 60000;

export async function runPipeline(env: Env, now = new Date()): Promise<RunReport> {
  const runId = `run_${now.toISOString()}`;
  const { results: schools } = await env.DB.prepare("SELECT * FROM schools WHERE active = 1").all<School>();
  const report: RunReport = { run_id: runId, ispp: await syncIspp(env, schools), schools: [] };
  for (const school of schools) {
    const steps: string[] = [];
    report.schools.push({ slug: school.slug, steps });
    for (const [name, step] of [
      ["collect", () => collectNews(env, school)],
      ["extract", () => extractNewFacts(env, school)],
      ["write", () => writeForSchool(env, school, runId, now)],
    ] as const) {
      try {
        steps.push(`${name}: ${await step()}`);
      } catch (err) {
        steps.push(`${name}: failed - ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
  return report;
}

export async function syncIspp(env: Env, schools?: School[]): Promise<string[]> {
  try {
    const list = schools ?? (await env.DB.prepare("SELECT * FROM schools WHERE active = 1").all<School>()).results;
    return await importIsppFacts(env.DB, list, () => fetchIsppMaster(USER_AGENT));
  } catch (err) {
    return [`failed - ${err instanceof Error ? err.message : String(err)}`];
  }
}

async function collectNews(env: Env, school: School): Promise<string> {
  if (!school.news_feed) return "no feed configured";
  const res = await fetch(school.news_feed, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`feed returned ${res.status}`);
  const items = parseNewsSource(await res.text(), school.news_feed);
  let added = 0;
  for (const item of items) {
    const r = await env.DB.prepare(
      "INSERT OR IGNORE INTO source_items (school_slug, url, title, summary, published_at) VALUES (?, ?, ?, ?, ?)",
    ).bind(school.slug, item.url, item.title, item.summary, item.published_at).run();
    added += r.meta.changes ?? 0;
  }
  return `${added} new of ${items.length} items`;
}

async function extractNewFacts(env: Env, school: School): Promise<string> {
  const { results: items } = await env.DB.prepare(
    "SELECT id, url, published_at FROM source_items WHERE school_slug = ? AND extracted_at IS NULL ORDER BY published_at DESC LIMIT ?",
  ).bind(school.slug, EXTRACT_PER_RUN).all<{ id: number; url: string; published_at: string | null }>();
  let factCount = 0;
  let deferred = 0;
  for (const item of items) {
    let res: Response | null = null;
    try {
      res = await fetch(item.url, { headers: { "user-agent": USER_AGENT } });
    } catch {
      res = null;
    }
    const outcome = pageOutcome(res?.status ?? null);
    if (outcome === "retry") {
      // The site is busy or down: try this page again on a later run, and stop reading it for now.
      const r = await env.DB.prepare("UPDATE source_items SET extract_attempts = extract_attempts + 1 WHERE id = ? RETURNING extract_attempts")
        .bind(item.id).first<{ extract_attempts: number }>();
      if ((r?.extract_attempts ?? MAX_PAGE_ATTEMPTS) >= MAX_PAGE_ATTEMPTS) {
        await env.DB.prepare("UPDATE source_items SET extracted_at = datetime('now'), facts_found = 0 WHERE id = ?").bind(item.id).run();
      } else {
        deferred++;
      }
      break;
    }
    let found = 0;
    if (res && outcome === "read") {
      const text = htmlToText(articleHtml(await res.text())).slice(0, PAGE_CHAR_LIMIT);
      const { facts, names } = await extractFacts(env.ANTHROPIC_API_KEY, school.name, text);
      const stmts = [
        ...facts.map((f) =>
          env.DB.prepare(
            "INSERT OR IGNORE INTO facts (school_slug, key, value, unit, as_of, source_url, source_kind, quote) VALUES (?, ?, ?, ?, ?, ?, 'school_site', ?)",
          ).bind(school.slug, f.key, f.value, f.unit, item.published_at, item.url, f.quote),
        ),
        ...names.map((n) =>
          env.DB.prepare("INSERT OR IGNORE INTO entities (school_slug, name, source_url) VALUES (?, ?, ?)").bind(school.slug, n, item.url),
        ),
      ];
      if (stmts.length) await env.DB.batch(stmts);
      found = facts.length;
    }
    await env.DB.prepare("UPDATE source_items SET extracted_at = datetime('now'), facts_found = ? WHERE id = ?").bind(found, item.id).run();
    factCount += found;
  }
  return `${items.length - deferred} pages read, ${factCount} grounded facts${deferred ? `, ${deferred} deferred (site busy)` : ""}`;
}

// What to do with a news page response: read it, try again on a later run (temporary failure:
// no response, 408, 429, 5xx), or record it as having no facts (any other error, such as 404).
export function pageOutcome(status: number | null): "read" | "retry" | "skip" {
  if (status === null || status === 408 || status === 429 || status >= 500) return "retry";
  return status >= 200 && status < 300 ? "read" : "skip";
}

async function writeForSchool(env: Env, school: School, runId: string, now: Date): Promise<string> {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const thisMonth = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM articles WHERE school_slug = ? AND lang = 'en' AND status IN ('verified', 'published') AND created_at >= ?",
  ).bind(school.slug, monthStart.replace("T", " ").slice(0, 19)).first<{ n: number }>();
  if ((thisMonth?.n ?? 0) >= Number(env.MAX_POSTS_PER_SCHOOL_PER_MONTH)) return "monthly limit reached";

  const facts = (await env.DB.prepare("SELECT id, key, value, unit, source_url, quote FROM facts WHERE school_slug = ?").bind(school.slug).all<FactRow>()).results;
  if (!facts.length) return "no facts yet";

  const { results: news } = await env.DB.prepare(
    "SELECT id, title, summary, url, published_at FROM source_items WHERE school_slug = ? AND used_by IS NULL AND facts_found > 0 ORDER BY published_at DESC LIMIT ?",
  ).bind(school.slug, NEWS_PER_ARTICLE).all<{ id: number; title: string; summary: string | null; url: string; published_at: string | null }>();
  const prior = (await env.DB.prepare(
    "SELECT id, title, body_md FROM articles WHERE school_slug = ? AND lang = 'en' AND status != 'unpublished' ORDER BY created_at DESC LIMIT 50",
  ).bind(school.slug).all<{ id: number; title: string; body_md: string }>()).results;
  // No unused news with facts: write a topic guide from the recorded facts instead, one topic at a time.
  let guide: { topic: GuideTopic; facts: FactRow[] } | null = null;
  if (!news.length) {
    const tried = (await env.DB.prepare("SELECT topic FROM guide_attempts WHERE school_slug = ?").bind(school.slug).all<{ topic: string }>()).results;
    guide = pickGuideTopic(facts, new Set(tried.map((t) => t.topic)));
    if (!guide) return "no new material; nothing written";
  }
  // A guide sees, and is checked against, only its topic's facts.
  const material = guide ? guide.facts : facts;
  const label = guide ? `guide ${guide.topic.id}: ` : "";
  const recordGuide = async (outcome: string, articleId: number | null, detail: string | null) => {
    if (!guide) return;
    await env.DB.prepare("INSERT OR IGNORE INTO guide_attempts (school_slug, topic, article_id, outcome, detail) VALUES (?, ?, ?, ?, ?)")
      .bind(school.slug, guide.topic.id, articleId, outcome, detail).run();
  };

  const entities = (await env.DB.prepare("SELECT name FROM entities WHERE school_slug = ?").bind(school.slug).all<{ name: string }>()).results.map((e) => e.name);
  const schoolInfo = { name: school.name, city: school.city, country: school.country };
  const newsForModel = news.map(({ title, summary, url, published_at }) => ({ title, summary, url, published_at }));
  const writeInput = {
    school: schoolInfo,
    facts: material,
    entities,
    news: newsForModel,
    guide: guide ? { topic: guide.topic.id, brief: guide.topic.brief } : undefined,
    existingTitles: prior.map((p) => p.title),
    today: now.toISOString().slice(0, 10),
  };
  const generated = await writeArticle(env.ANTHROPIC_API_KEY, writeInput);
  if (generated.skip) {
    await recordGuide("skipped", null, generated.skip_reason);
    return `${label}model skipped: ${generated.skip_reason}`;
  }

  const newsDates = publishedDateNumbers(news.map((n) => n.published_at));
  const ctx = { school, facts: material, entities, newsTitles: news.map((n) => n.title), allowedNumbers: newsDates, now };
  // Rules catch numbers and names; the grounding check reads each sentence against the material.
  const evaluate = async (d: ArticleDraft) => {
    const rules = verifyArticle(d, { ...ctx, lang: "en", priorArticles: prior });
    const grounding = await checkGrounding(env.ANTHROPIC_API_KEY, d, { school: schoolInfo, facts: material, entities, news: newsForModel });
    const problems = [...rules.problems, ...grounding];
    return { ...rules, problems, passed: problems.length === 0 };
  };

  let draft: ArticleDraft = { title: generated.title, tldr: generated.tldr, body_md: generated.body_markdown, faq: generated.faq };
  let result = await evaluate(draft);
  let firstAttempt: { draft: ArticleDraft; problems: unknown[] } | null = null;
  if (canRevise(result.problems)) {
    firstAttempt = { draft, problems: result.problems };
    // One repair pass on the flagged sentences, then the same checks again; whatever is left holds the article.
    const r = await reviseArticle(env.ANTHROPIC_API_KEY, {
      ...writeInput,
      draft: { title: draft.title, tldr: draft.tldr, body_markdown: draft.body_md, faq: draft.faq },
      problems: result.problems,
    });
    draft = { title: r.title, tldr: r.tldr, body_md: r.body_markdown, faq: r.faq };
    result = await evaluate(draft);
  }
  const revised = firstAttempt !== null;
  const slug = await uniqueSlug(env, "en", `${school.slug}-${sanitizeSlug(generated.slug)}`);
  const sources = sourcesFor(material, result.usedFactIds, news.map((n) => n.url));
  const articleId = await saveArticle(env, {
    school_slug: school.slug, lang: "en", translation_of: null, slug, kind: generated.kind, draft, sources, runId,
    passed: result.passed, problems: result.problems, autoPublish: env.AUTO_PUBLISH === "true",
  });
  await recordGuide(!result.passed ? "held" : env.AUTO_PUBLISH === "true" ? "published" : "verified", articleId, null);
  if (firstAttempt) {
    // Keep what the checker first objected to and the draft it read, so the repair can be audited.
    await env.DB.prepare("INSERT INTO article_revisions (article_id, draft_json, problems_json) VALUES (?, ?, ?)")
      .bind(articleId, JSON.stringify(firstAttempt.draft), JSON.stringify(firstAttempt.problems)).run();
  }
  if (news.length) {
    await env.DB.batch(news.map((n) => env.DB.prepare("UPDATE source_items SET used_by = ? WHERE id = ?").bind(articleId, n.id)));
  }
  if (!result.passed) {
    await alert(env, { article_id: articleId, school: school.slug, problems: result.problems });
    return `${label}article ${articleId} held${revised ? " after one revision" : ""}: ${result.problems.length} problems`;
  }

  const out = [`${label}article ${articleId} ${env.AUTO_PUBLISH === "true" ? "published" : "verified"}${revised ? " after one revision" : ""}`];
  for (const [lang, language] of Object.entries(TRANSLATE_TO)) {
    const t = await translateArticle(env.ANTHROPIC_API_KEY, { title: draft.title, tldr: draft.tldr, body_markdown: draft.body_md, faq: draft.faq }, language);
    const tDraft: ArticleDraft = { title: t.title, tldr: t.tldr, body_md: t.body_markdown, faq: t.faq };
    const priorT = (await env.DB.prepare(
      "SELECT id, title, body_md FROM articles WHERE school_slug = ? AND lang = ? AND status != 'unpublished' ORDER BY created_at DESC LIMIT 50",
    ).bind(school.slug, lang).all<{ id: number; title: string; body_md: string }>()).results;
    const englishDates = dateNumbers([draft.title, draft.tldr, draft.body_md, ...draft.faq.flatMap((f) => [f.question, f.answer])].join("\n"));
    const tResult = verifyArticle(tDraft, { ...ctx, lang, priorArticles: priorT, allowedNumbers: [...newsDates, ...englishDates] });
    const tId = await saveArticle(env, {
      school_slug: school.slug, lang, translation_of: articleId, slug, kind: generated.kind, draft: tDraft, sources, runId,
      passed: tResult.passed, problems: tResult.problems, autoPublish: env.AUTO_PUBLISH === "true",
    });
    if (!tResult.passed) await alert(env, { article_id: tId, school: school.slug, problems: tResult.problems });
    out.push(`${lang} ${tId} ${tResult.passed ? "ok" : "held"}`);
  }
  return out.join(", ");
}

// Sentence-level problems can be repaired; a duplicate, a too-short body or a grounding check that
// could not run cannot, so those articles are held as they are.
export function canRevise(problems: Problem[]): boolean {
  if (!problems.length) return false;
  return problems.every(
    (p) =>
      (p.kind === "unknown_entity" || p.kind === "unsupported_number" || p.kind === "unsupported_claim") &&
      !p.detail.startsWith("grounding check could not run"),
  );
}

interface SaveInput {
  school_slug: string;
  lang: string;
  translation_of: number | null;
  slug: string;
  kind: string;
  draft: ArticleDraft;
  sources: string[];
  runId: string;
  passed: boolean;
  problems: Problem[];
  autoPublish: boolean;
}

async function saveArticle(env: Env, a: SaveInput): Promise<number> {
  const status = !a.passed ? "held" : a.autoPublish ? "published" : "verified";
  const row = await env.DB.prepare(
    `INSERT INTO articles (school_slug, lang, translation_of, slug, kind, title, tldr, body_md, faq_json, sources_json, status, run_id, model, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${status === "published" ? "datetime('now')" : "NULL"}) RETURNING id`,
  ).bind(
    a.school_slug, a.lang, a.translation_of, a.slug, a.kind, a.draft.title, a.draft.tldr, a.draft.body_md,
    JSON.stringify(a.draft.faq), JSON.stringify(a.sources), status, a.runId, MODEL,
  ).first<{ id: number }>();
  const id = row!.id;
  await env.DB.batch([
    env.DB.prepare("INSERT INTO verification_results (article_id, passed, problems_json) VALUES (?, ?, ?)").bind(id, a.passed ? 1 : 0, JSON.stringify(a.problems)),
    env.DB.prepare("INSERT INTO article_events (article_id, from_status, to_status, reason) VALUES (?, NULL, ?, ?)").bind(id, status, a.passed ? "verification passed" : "verification failed"),
  ]);
  return id;
}

export async function unpublish(env: Env, by: { run_id?: string; article_id?: number }, reason: string): Promise<number> {
  const where = by.run_id ? "run_id = ?" : "(id = ? OR translation_of = ?)";
  const params = by.run_id ? [by.run_id] : [by.article_id, by.article_id];
  const { results } = await env.DB.prepare(`SELECT id, status FROM articles WHERE ${where} AND status != 'unpublished'`).bind(...params).all<{ id: number; status: string }>();
  if (!results.length) return 0;
  await env.DB.batch(results.flatMap((r) => [
    env.DB.prepare("UPDATE articles SET status = 'unpublished' WHERE id = ?").bind(r.id),
    env.DB.prepare("INSERT INTO article_events (article_id, from_status, to_status, reason) VALUES (?, ?, 'unpublished', ?)").bind(r.id, r.status, reason),
  ]));
  return results.length;
}

async function uniqueSlug(env: Env, lang: string, base: string): Promise<string> {
  for (let i = 1; ; i++) {
    const slug = i === 1 ? base : `${base}-${i}`;
    const hit = await env.DB.prepare("SELECT 1 FROM articles WHERE lang = ? AND slug = ?").bind(lang, slug).first();
    if (!hit) return slug;
  }
}

export function sanitizeSlug(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "article";
}

function sourcesFor(facts: FactRow[], usedIds: number[], newsUrls: string[]): string[] {
  const used = new Set(usedIds);
  return [...new Set([...facts.filter((f) => used.has(f.id)).map((f) => f.source_url), ...newsUrls])];
}

async function alert(env: Env, payload: unknown): Promise<void> {
  if (!env.ALERT_WEBHOOK_URL) return;
  await fetch(env.ALERT_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ site: env.SITE_NAME, event: "article_held", ...(payload as object) }),
  }).catch(() => undefined);
}
