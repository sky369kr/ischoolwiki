import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { FactRow } from "./verify";

export const MODEL = "claude-opus-5-5";
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export const ARTICLE_KINDS = ["results", "programme", "comparison", "parent_guide", "news"] as const;

const ArticleSchema = z.object({
  skip: z.boolean(),
  skip_reason: z.string(),
  kind: z.enum(ARTICLE_KINDS),
  slug: z.string(),
  title: z.string(),
  tldr: z.string(),
  body_markdown: z.string(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
});
export type GeneratedArticle = z.infer<typeof ArticleSchema>;

const TranslationSchema = z.object({
  title: z.string(),
  tldr: z.string(),
  body_markdown: z.string(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
});
export type Translation = z.infer<typeof TranslationSchema>;

const WRITER_SYSTEM = `You write articles for iSchoolWiki, a reference site about international schools in Asia, read by parents choosing a school.

Every statement of fact must come from the FACTS or NEWS given in the request. Do not add numbers, rankings, names of universities, people, awards or programmes that are not in that material, even if you believe them to be true. If the material does not support a useful article, set skip to true and explain why in skip_reason; a skipped article is a correct outcome.

Write digits only for figures copied exactly from FACTS (same value, no rounding, no conversions, no arithmetic). Spell other counts in words ("three programmes"). Years are fine only when they appear in FACTS or are the current or next year.
Never invent numbers, grades, ages or dates, not even as examples or hypotheticals ("a Grade 11 student"); if an example is needed, use one from the material or none.

Say only what the material says. Do not infer, speculate or generalise: no "this suggests", "likely", "typically", "which means", no claims about causes, about how the school works, what it offers or who it suits beyond what FACTS (including each fact's quote) and NEWS state. A plain restatement or a combination of two stated facts is fine; a conclusion drawn from them is not.

Tone: report what the school has published, plainly, for a parent reading it as reference material.
- Lead with what the material does say; most of the article should be stated facts.
- No evaluative judgements in either direction: neither praise ("impressive", "strong") nor criticism ("only", "fails to", "does not disclose"). Do not compare the school with others unless a fact does.
- Gaps: do not say what a school's post, page, announcement, website or "published material" does not state, cover or mention, and add no section about what is missing. You see only facts taken from those pages, not the pages themselves, so you cannot know what they leave out. One exception: when the article is about fees and a charge a parent would clearly need has no fee fact, you may say once, neutrally, that the school's fee schedule does not list it ("The published fee schedule does not list boarding fees."). Never frame a gap as the school withholding information.
- Do not mention any relationship between the school and this site.
- No advice or instructions to the reader ("ask the admissions office", "contact the school", "families should").
- Do not attach term, semester or season names ("autumn term") to dates unless the material uses them.
- Describe a news item's subject only in words from its title, summary or a fact quote; never infer it from the URL.
- Include fees only when the article is about admissions or fees; do not add a fee table to an article on another subject.
- Name a school group, network or affiliation (for example "part of Nord Anglia Education") only when a fact or its quote states that affiliation for this school; a group name appearing elsewhere in the material is not enough.
- Do not count, order or rank the news items you were given ("the newest of three posts this month"): you see only a selection of the school's posts.
- Do not name individual students, graduates or their family members, even when the school names them; refer to them by number, year group or class ("two students", "the Class of 2026"). Staff the school names in their role (principal, head of section) may be named.
- When a list in the material has several items (offers by university, results by subject), give every item or say plainly that the article lists only some; never present part of a list as the whole.
- No claims that the material is complete ("these are the only figures", "the post lists all"): you only know what you were given.

Style:
- title and headings in sentence case (capitalize only the first word and proper nouns)
- tldr: one sentence a parent could quote, stating the main fact
- body_markdown: 500 to 900 words, ## headings, short paragraphs, neutral and specific; no superlatives ("best", "top", "leading") unless a fact says so; no calls to action
- faq: three to five questions parents actually ask, each answered from the material
- slug: lowercase ascii words joined by hyphens, under 70 characters
- Do not mention iSchoolWiki, myispp.com, 36.9° or any marketing service.`;

const TRANSLATOR_SYSTEM = `You translate iSchoolWiki articles from English for parents reading in the target language.
Keep every number exactly as written, in digits, with the same value. Quantities the source writes in words stay in words: "a year" or "one semester" become "한 해", "한 학기", never "1년" or "1학기". Dates may be written in the target language's usual form. Keep school, university and programme names as in the source (add a common local rendering in parentheses only when one is standard). Do not add or drop any statement. Use natural, plain prose; headings stay as ## headings.`;

export interface WriteInput {
  school: { name: string; city: string; country: string };
  facts: FactRow[];
  entities: string[];
  news: { title: string; summary: string | null; url: string; published_at: string | null }[];
  // Set for a topic guide: the facts given are only this topic's, and there is no news.
  guide?: { topic: string; brief: string };
  existingTitles: string[];
  today: string;
}

export class RefusedError extends Error {}

function client(apiKey: string) {
  return new Anthropic({ apiKey });
}

export async function writeArticle(apiKey: string, input: WriteInput): Promise<GeneratedArticle> {
  const material = {
    today: input.today,
    school: input.school,
    facts: input.facts.map((f) => ({ key: f.key, value: f.value, unit: f.unit, quote: f.quote ?? null, source: f.source_url })),
    other_names_you_may_use: input.entities,
    news: input.news,
    articles_already_published: input.existingTitles,
  };
  const stream = client(apiKey).beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: "high", format: zodOutputFormat(ArticleSchema) },
    system: [{ type: "text", text: WRITER_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: input.guide
          ? `Write one reference guide for parents about ${input.guide.brief}, for this school, using only the facts below. Set kind to "parent_guide". If an article already published covers this topic, or the facts are too thin for a useful guide, set skip to true and say why.\n\n${JSON.stringify(material, null, 2)}`
          : `Write one new article about this school that does not repeat the articles already published. Prefer the newest news item that has supporting facts.\n\n${JSON.stringify(material, null, 2)}`,
      },
    ],
  });
  const message = await stream.finalMessage();
  return ArticleSchema.parse(readJson(message));
}

const REVISER_SYSTEM = `You fix an iSchoolWiki article that a checker held. You get the material the writer was allowed to use, the article, and the checker's problems.
Change only what the problems point at: delete the sentence, or rewrite it so that it says only what the material states. Leave every other sentence exactly as it is. Do not add new facts, numbers, names or sections. If a heading or FAQ item becomes empty, remove it.
The writing rules still apply:
${WRITER_SYSTEM}`;

export interface RevisionInput extends WriteInput {
  draft: Translation;
  problems: { kind: string; detail: string }[];
}

// One repair pass after verification: the article goes back through the same checks afterwards.
export async function reviseArticle(apiKey: string, input: RevisionInput): Promise<Translation> {
  const material = {
    school: input.school,
    facts: input.facts.map((f) => ({ key: f.key, value: f.value, unit: f.unit, quote: f.quote ?? null, source: f.source_url })),
    other_names_you_may_use: input.entities,
    news: input.news,
  };
  const stream = client(apiKey).beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: "high", format: zodOutputFormat(TranslationSchema) },
    system: [{ type: "text", text: REVISER_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: `MATERIAL\n${JSON.stringify(material, null, 2)}\n\nARTICLE\n${JSON.stringify(input.draft, null, 2)}\n\nPROBLEMS\n${JSON.stringify(input.problems, null, 2)}`,
      },
    ],
  });
  const message = await stream.finalMessage();
  return TranslationSchema.parse(readJson(message));
}

export async function translateArticle(apiKey: string, article: Translation, targetLanguage: string): Promise<Translation> {
  const stream = client(apiKey).beta.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    betas: [FALLBACK_BETA],
    fallbacks: "default",
    output_config: { effort: "medium", format: zodOutputFormat(TranslationSchema) },
    system: [{ type: "text", text: TRANSLATOR_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [
      { role: "user", content: `Target language: ${targetLanguage}\n\n${JSON.stringify(article, null, 2)}` },
    ],
  });
  const message = await stream.finalMessage();
  return TranslationSchema.parse(readJson(message));
}

function readJson(message: Anthropic.Beta.BetaMessage): unknown {
  if (message.stop_reason === "refusal") {
    throw new RefusedError(`model declined: ${message.stop_details?.category ?? "unknown"}`);
  }
  if (message.stop_reason === "max_tokens") throw new Error("output hit max_tokens");
  const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return JSON.parse(text);
}
