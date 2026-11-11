import { describe, expect, it } from "vitest";
import { verifyArticle, type ArticleDraft, type VerifyContext } from "../src/verify";

const ctx: VerifyContext = {
  lang: "en",
  school: { name: "British School of Beijing, Shunyi", city: "Beijing", country: "China" },
  facts: [
    { id: 1, key: "ib_average", value: "36.5", unit: "points", source_url: "https://example.org/results" },
    { id: 2, key: "students", value: "1,200", unit: null, source_url: "https://example.org/about" },
    { id: 3, key: "tuition_range", value: "USD 32,000–41,000", unit: "per year", source_url: "https://example.org/fees" },
  ],
  entities: ["Juilliard", "MIT"],
  priorArticles: [],
  now: new Date("2026-11-11T00:00:00Z"),
};

const filler =
  " The school describes its approach to learning in detail on its website, and parents can read more there about how classes are organised across the year groups.";

function draft(body: string, extra: Partial<ArticleDraft> = {}): ArticleDraft {
  return {
    title: "What families should know about IB results in Shunyi",
    tldr: "Students averaged 36.5 points in the IB Diploma.",
    body_md: body + filler.repeat(5),
    faq: [],
    ...extra,
  };
}

describe("verifyArticle", () => {
  it("passes when every number and name is backed by the fact table", () => {
    const r = verifyArticle(
      draft("## Results\n\nAbout 1,200 students attend. Fees run from USD 32,000 to 41,000 per year. Graduates went on to MIT and Juilliard in 2026."),
      ctx,
    );
    expect(r.problems).toEqual([]);
    expect(r.passed).toBe(true);
    expect(r.usedFactIds.sort()).toEqual([1, 2, 3]);
  });

  it("holds an article with a number that is not in the facts", () => {
    const r = verifyArticle(draft("Students averaged 38 points this year."), ctx);
    expect(r.passed).toBe(false);
    expect(r.problems).toContainEqual(expect.objectContaining({ kind: "unsupported_number", detail: expect.stringContaining('"38"') }));
  });

  it("holds a rounded or altered figure", () => {
    const r = verifyArticle(draft("Around 1,250 students attend the school."), ctx);
    expect(r.problems.map((p) => p.kind)).toContain("unsupported_number");
  });

  it("holds an invented university name", () => {
    const r = verifyArticle(draft("Several graduates were admitted to Harvard University and Stanford last spring."), ctx);
    const names = r.problems.filter((p) => p.kind === "unknown_entity").map((p) => p.detail);
    expect(names.join(" ")).toContain("Harvard University");
    expect(names.join(" ")).toContain("Stanford");
  });

  it("does not count markdown list numbering as claims", () => {
    const r = verifyArticle(draft("Steps for families:\n\n1. Visit the campus.\n2. Submit the form.\n3. Attend an interview."), ctx);
    expect(r.problems.filter((p) => p.kind === "unsupported_number")).toEqual([]);
  });

  it("allows curriculum terms and the school's own name", () => {
    const r = verifyArticle(draft("The British School of Beijing, Shunyi offers the IB Diploma Programme and IGCSE courses in English and Mandarin."), ctx);
    expect(r.problems.filter((p) => p.kind === "unknown_entity")).toEqual([]);
  });

  it("holds a near-copy of an earlier article", () => {
    const body = "Students averaged 36.5 points in the IB Diploma, and about 1,200 students attend.";
    const prior = { id: 7, title: "Another title", body_md: draft(body).body_md };
    const r = verifyArticle(draft(body), { ...ctx, priorArticles: [prior] });
    expect(r.problems.map((p) => p.kind)).toContain("duplicate");
  });

  it("holds an article that is too short", () => {
    const r = verifyArticle({ title: "t", tldr: "t", body_md: "Short.", faq: [] }, ctx);
    expect(r.problems.map((p) => p.kind)).toContain("empty");
  });

  it("checks only numbers for Korean translations", () => {
    const r = verifyArticle(
      draft("학생 약 1,200명이 재학 중이며 IB 평균은 37점입니다.", { title: "순이 IB 결과", tldr: "IB 평균 36.5점." }),
      { ...ctx, lang: "ko" },
    );
    expect(r.problems).toEqual([expect.objectContaining({ kind: "unsupported_number", detail: expect.stringContaining('"37"') })]);
  });
  it("allows currency codes, unit words, hyphenated and dotted forms of known words", () => {
    const fees = { ...ctx, facts: [...ctx.facts, { id: 4, key: "fee", value: "249,500", unit: "RMB per year, Kindergarten, P.R. China", source_url: "https://example.org/fees" }] };
    const r = verifyArticle(
      draft("Fees are 249,500 RMB (CNY) per year for Kindergarten. It follows a British-style curriculum in Beijing, P.R. China."),
      fees,
    );
    expect(r.problems).toEqual([]);
  });

  it("treats table cells and question openers as sentence starts", () => {
    const r = verifyArticle(
      draft("| Stage | Annual fee |\n|---|---|\n| Primary | USD 32,000 |", {
        faq: [{ question: "Does British School of Beijing teach Mandarin?", answer: "Yes, Mandarin is taught." }],
      }),
      ctx,
    );
    expect(r.problems).toEqual([]);
  });

  it("treats a leading preposition as a sentence start", () => {
    const r = verifyArticle(draft("On October 31, students visited the campus. During March, families toured it."), ctx);
    expect(r.problems.filter((p) => p.kind === "unknown_entity")).toEqual([]);
  });

  it("still holds an invented name after a leading preposition", () => {
    const r = verifyArticle(draft("After Westfield Gala, families went home."), ctx);
    const names = r.problems.filter((p) => p.kind === "unknown_entity").map((p) => p.detail).join(" ");
    expect(names).toContain("Westfield Gala");
  });

  it("still holds invented names after an opener, in a table cell or inside a hyphenated word", () => {
    const r = verifyArticle(
      draft("A Monster Mash took place.\n\n| Event | Notes |\n|---|---|\n| Spring Gala | Held at Westfield Hall |\n\nIt is a Harvard-style programme.", {
        faq: [{ question: "Did Stanford visit?", answer: "No." }],
      }),
      ctx,
    );
    const names = r.problems.filter((p) => p.kind === "unknown_entity").map((p) => p.detail).join(" ");
    expect(names).toContain("Monster Mash");
    expect(names).toContain("Westfield Hall");
    expect(names).toContain("Harvard-style");
    expect(names).toContain("Stanford");
  });
});
