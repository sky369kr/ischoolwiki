import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { MODEL } from "./generate";
import { retryOnce } from "./retry";

const RETRY_WAIT_MS = 30_000;
import type { ArticleDraft, FactRow, Problem } from "./verify";

// Second check after the rule-based verifier: a model reads every sentence of the English draft
// against the same material the writer had and lists the ones the material does not support.
// The rules catch numbers and names; this catches inferences, generalisations and causal claims.

const GroundingSchema = z.object({
  unsupported: z.array(z.object({ sentence: z.string(), reason: z.string() })),
});
export type GroundingOutput = z.infer<typeof GroundingSchema>;

const CHECKER_SYSTEM = `You check an article about one school against the only material its writer was allowed to use.
Go through the title, tldr, every sentence of the body and every FAQ question and answer. A sentence is supported when the FACTS (value, unit, quote) or NEWS state it, or when it only restates or plainly combines them.
List every sentence that is not supported, including:
- inferences and speculation ("this suggests", "likely", "typically", "which means")
- causal claims and generalisations the material does not state
- descriptions of how the school works, what it offers or who it suits beyond what the material says
- numbers, grades, ages or dates used as examples that are not in FACTS
- evaluative judgements, positive or negative, that no fact states
- any sentence that names an individual student, graduate or family member (staff named in their role are fine)
- any sentence saying that the school's post, page, announcement, website or published material does not state, cover, mention or describe something: the material holds only facts taken from those pages, not the pages themselves, so such a sentence is never supported. The one exception is a sentence saying the school's fee schedule does not list a charge, when no fee fact covers that charge.
Copy each listed sentence exactly as it appears in the article and give a short reason. An empty list is correct when everything is supported.`;

export interface GroundingMaterial {
  school: { name: string; city: string; country: string };
  facts: FactRow[];
  entities: string[];
  news: { title: string; summary: string | null; url: string; published_at: string | null }[];
}

export async function checkGrounding(apiKey: string, draft: ArticleDraft, material: GroundingMaterial): Promise<Problem[]> {
  try {
    const message = await retryOnce(() => new Anthropic({ apiKey }).beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high", format: zodOutputFormat(GroundingSchema) },
      system: [{ type: "text", text: CHECKER_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: checkerRequest(draft, material) }],
    }).finalMessage(), RETRY_WAIT_MS);
    if (message.stop_reason === "refusal") return [failed("model declined the check")];
    if (message.stop_reason === "max_tokens") return [failed("check hit max_tokens")];
    const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    return groundingProblems(GroundingSchema.parse(JSON.parse(text)));
  } catch (err) {
    // Fail closed: an article whose grounding could not be checked is held, not published.
    return [failed(err instanceof Error ? err.message : String(err))];
  }
}

export function checkerRequest(draft: ArticleDraft, m: GroundingMaterial): string {
  const material = {
    school: m.school,
    facts: m.facts.map((f) => ({ key: f.key, value: f.value, unit: f.unit, quote: f.quote ?? null, source: f.source_url })),
    other_names: m.entities,
    news: m.news,
  };
  return `MATERIAL\n${JSON.stringify(material, null, 2)}\n\nARTICLE\n${JSON.stringify(
    { title: draft.title, tldr: draft.tldr, body_markdown: draft.body_md, faq: draft.faq },
    null,
    2,
  )}`;
}

export function groundingProblems(out: GroundingOutput): Problem[] {
  return out.unsupported
    .filter((u) => u.sentence.trim())
    .map((u) => ({ kind: "unsupported_claim", detail: `"${u.sentence.trim()}": ${u.reason.trim()}` }));
}

function failed(why: string): Problem {
  return { kind: "unsupported_claim", detail: `grounding check could not run (${why}); held for review` };
}
