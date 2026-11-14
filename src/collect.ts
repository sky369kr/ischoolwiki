import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { MODEL, RefusedError } from "./generate";
import { decodeEntities } from "./text";

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
    const link = tag(b, "link") || decodeEntities(b.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? "");
    if (!title || !/^https?:\/\//.test(link)) return [];
    const url = withoutTracking(link);
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

// For schools without RSS: article links on a news index page, limited to the same host and
// the index's own path section, with the date taken from the /news/YYYY/M/D/ URL pattern.
export function parseNewsIndex(html: string, indexUrl: string): FeedItem[] {
  const base = new URL(indexUrl);
  const section = base.pathname.replace(/[^/]*$/, "");
  const seen = new Map<string, FeedItem>();
  for (const m of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    let url: URL;
    try {
      url = new URL(decodeEntities(m[1]!), base);
    } catch {
      continue;
    }
    const date = url.pathname.match(/\/news\/(\d{4})\/(\d{1,2})(?:\/(\d{1,2}))?\//);
    if (url.host !== base.host || !url.pathname.startsWith(section) || !date) continue;
    url.hash = "";
    url.search = "";
    const href = url.toString();
    const text = decodeEntities(m[2]!.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    const prev = seen.get(href);
    if (prev && prev.title.length >= text.length) continue;
    const slugTitle = url.pathname.split("/").filter(Boolean).pop()!.replace(/-/g, " ");
    const [, y, mo, d] = date;
    seen.set(href, {
      url: href,
      title: text.length >= 8 ? text : slugTitle,
      summary: null,
      published_at: new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d ?? 1))).toISOString(),
    });
  }
  return [...seen.values()];
}

// Feeds tag links with campaign parameters (?utm_source=rss&...). They change nothing on the page, but
// would show in an article's source list and make the same post look like a different URL.
export function withoutTracking(href: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  for (const key of [...url.searchParams.keys()]) if (/^utm_/i.test(key)) url.searchParams.delete(key);
  return url.toString();
}

export function parseNewsSource(body: string, url: string): FeedItem[] {
  return /^\s*(<\?xml|<rss|<feed)/i.test(body) ? parseFeed(body) : parseNewsIndex(body, url);
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
  if (!m) return "";
  return decodeEntities(m[1]!.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}


// News pages end with teasers of other posts ("Related news") followed by the site footer and banners.
// None of that is the page's own article: a fact taken from it gets attributed to the wrong post and
// date (a February offer announcement read as part of a November post). Cut at the first such heading.
const OTHER_POSTS_HEADING = /<h[2-4]\b[^>]*>\s*(?:<[^>]+>\s*)*(?:related|more|latest|recent|other)\s+(?:news|articles|posts|stories|blogs?)\b|<h[2-4]\b[^>]*>\s*(?:<[^>]+>\s*)*you (?:may|might) also like/i;

export function articleHtml(html: string): string {
  const m = OTHER_POSTS_HEADING.exec(html);
  return m ? html.slice(0, m.index) : html;
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
Also list proper names the page mentions in connection with the school (programmes, universities graduates entered, named facilities, partners, named school events, festivals and holidays the school marks, competitions), each with its exact quote.
Leave out opinions, marketing claims ("world-class"), and anything about other schools.
Leave out everything about an individual student, graduate or family member: one person's results, grades, awards, rankings, competition wins, sports or arts achievements, university or college, background or story, and their name. A page that profiles or features one student or graduate (a "meet our student" post, an athlete of the month, an alumni story) gives an empty list. Facts about students as a group (how many took part, results for a year group as a whole, universities a graduating class entered) are fine. Staff named in their school role are fine.
An empty list is a correct answer.`;

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
