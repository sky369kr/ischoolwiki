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

Style:
- title and headings in sentence case (capitalize only the first word and proper nouns)
- tldr: one sentence a parent could quote, stating the main fact
- body_markdown: 500 to 900 words, ## headings, short paragraphs, neutral and specific; no superlatives ("best", "top", "leading") unless a fact says so; no calls to action
- faq: three to five questions parents actually ask, each answered from the material
- slug: lowercase ascii words joined by hyphens, under 70 characters
- Do not mention iSchoolWiki, myispp.com, 36.9° or any marketing service.`;

const TRANSLATOR_SYSTEM = `You translate iSchoolWiki articles from English for parents reading in the target language.
Keep every number exactly as written, in digits, with the same value. Keep school, university and programme names as in the source (add a common local rendering in parentheses only when one is standard). Do not add or drop any statement. Use natural, plain prose; headings stay as ## headings.`;

export interface WriteInput {
  school: { name: string; city: string; country: string };
  facts: FactRow[];
  entities: string[];
  news: { title: string; summary: string | null; url: string; published_at: string | null }[];
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
    facts: input.facts.map((f) => ({ key: f.key, value: f.value, unit: f.unit, source: f.source_url })),
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
        content: `Write one new article about this school that does not repeat the articles already published. Prefer the newest news item that has supporting facts.\n\n${JSON.stringify(material, null, 2)}`,
      },
    ],
  });
  const message = await stream.finalMessage();
  return ArticleSchema.parse(readJson(message));
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
