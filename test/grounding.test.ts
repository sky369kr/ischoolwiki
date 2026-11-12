import { describe, expect, it } from "vitest";
import { checkerRequest, groundingProblems } from "../src/grounding";

describe("grounding check", () => {
  it("turns each unsupported sentence into a problem that holds the article", () => {
    const problems = groundingProblems({
      unsupported: [
        { sentence: "Boarders follow the same programme as day students.", reason: "not stated in the material" },
        { sentence: "  ", reason: "blank lines are ignored" },
      ],
    });
    expect(problems).toEqual([
      { kind: "unsupported_claim", detail: '"Boarders follow the same programme as day students.": not stated in the material' },
    ]);
  });

  it("passes nothing when the checker finds every sentence supported", () => {
    expect(groundingProblems({ unsupported: [] })).toEqual([]);
  });

  it("gives the checker each fact's quote alongside the article", () => {
    const req = checkerRequest(
      { title: "T", tldr: "S", body_md: "Body.", faq: [] },
      {
        school: { name: "Dalian American International School", city: "Dalian", country: "China" },
        facts: [{ id: 1, key: "fair_universities", value: "90+", unit: "universities", source_url: "https://example.org/a", quote: "more than 90+ universities attended" }],
        entities: [],
        news: [],
      },
    );
    expect(req).toContain("more than 90+ universities attended");
    expect(req).toContain('"body_markdown": "Body."');
  });
});
