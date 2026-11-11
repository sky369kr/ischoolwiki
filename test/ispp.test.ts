import { describe, expect, it } from "vitest";
import { factsFromIspp, importIsppFacts, type IsppSchool } from "../src/ispp";
import { verifyArticle } from "../src/verify";

const PDF = "https://www.daischina.org/-/media/dais-dalian/admission/2026-2027-fee-schedule---dais-en.pdf";

// Shape copied from myispp.com/data/master.json (DAIS, 2026-11-11), trimmed.
const dais: IsppSchool = {
  schoolId: "partner-china-dalian-american-international-school",
  status: "verified",
  isdFees: {
    currency: "CNY",
    year: "2026/27",
    source: PDF,
    tuition: [
      { grade: "Kindergarten – Grade 5", annualFee: 210000 },
      { grade: "Grade 9 – Grade 12", annualFee: 260000 },
    ],
    oneTimeFees: [{ name: "지원비 (환불 불가)", nameEn: "Application Fee (non-refundable)", amount: 2500 }],
    additionalFees: [
      { name: "기숙사 (5일제·7일제)", nameEn: "Boarding (5-day / 7-day)", amount: null },
      { name: "스쿨버스 (DDA 개발구)", nameEn: "School Bus (DDA Development Zone)", amount: 12550 },
      { name: "한국어만 있는 항목", amount: 100 },
    ],
    discounts: [
      { name: "장기 재학 할인", nameEn: "Long-Term Enrollment Discount" },
      { name: "형제 할인", nameEn: "Sibling Discount", rate: "10%" },
    ],
  },
};

describe("factsFromIspp", () => {
  it("turns sourced fee items into facts and drops items without an amount or English label", () => {
    const r = factsFromIspp(dais, "https://www.daischina.org/");
    expect(r.skipped).toBeNull();
    expect(r.facts).toEqual([
      { key: "annual_tuition_kindergarten_grade_5", value: "210,000", unit: "CNY per year, 2026/27, Kindergarten – Grade 5", as_of: "2026/27", source_url: PDF },
      { key: "annual_tuition_grade_9_grade_12", value: "260,000", unit: "CNY per year, 2026/27, Grade 9 – Grade 12", as_of: "2026/27", source_url: PDF },
      { key: "one_time_fee_application_fee_non_refundable", value: "2,500", unit: "CNY, 2026/27, Application Fee (non-refundable)", as_of: "2026/27", source_url: PDF },
      { key: "additional_fee_school_bus_dda_development_zone", value: "12,550", unit: "CNY, 2026/27, School Bus (DDA Development Zone)", as_of: "2026/27", source_url: PDF },
      { key: "discount_sibling_discount", value: "10", unit: "%, 2026/27, Sibling Discount", as_of: "2026/27", source_url: PDF },
    ]);
  });

  it("skips a source that is a description rather than a URL (BSB Shunyi as of 2026-11-11)", () => {
    const bsb = { ...dais, isdFees: { ...dais.isdFees, source: "nordangliaeducation.com (official 2026-27 fee schedule PDF)" } };
    expect(factsFromIspp(bsb, "https://www.nordangliaeducation.com/bsb-shunyi")).toEqual({ facts: [], skipped: "fee source is not a URL" });
  });

  it("skips fees sourced from a site other than the school's", () => {
    const third = { ...dais, isdFees: { ...dais.isdFees, source: "https://international-schools-database.com/x" } };
    expect(factsFromIspp(third, "https://www.daischina.org/").skipped).toMatch(/not the school's own site/);
  });

  it("skips records myispp has not verified, and schools it does not have", () => {
    expect(factsFromIspp({ ...dais, status: "unverified" }, "https://www.daischina.org/").skipped).toMatch(/not verified/);
    expect(factsFromIspp(undefined, "https://www.daischina.org/").skipped).toBe("not in myispp data");
  });

  it("gives the verifier what it needs to accept a sentence about these fees", () => {
    const facts = factsFromIspp(dais, "https://www.daischina.org/").facts.map((f, i) => ({ id: i + 1, ...f }));
    const body =
      "For 2026/27, tuition for Grade 9 – Grade 12 is CNY 260,000 per year, and families pay a one-time application fee of CNY 2,500. " +
      "A sibling discount of 10% applies. The school explains each charge in its published fee schedule, which parents can download from the admissions pages. ".repeat(4);
    const r = verifyArticle(
      { title: "DAIS fees for 2026/27", tldr: "Tuition ranges from CNY 210,000 to 260,000 a year.", body_md: body, faq: [] },
      {
        lang: "en",
        school: { name: "Dalian American International School", city: "Dalian", country: "China" },
        facts,
        entities: [],
        priorArticles: [],
        now: new Date("2026-11-11T00:00:00Z"),
      },
    );
    expect(r.problems.filter((p) => p.kind === "unsupported_number")).toEqual([]);
  });
});

describe("importIsppFacts", () => {
  function fakeDb() {
    const calls: { sql: string; args: unknown[] }[][] = [];
    const db = {
      prepare: (sql: string) => ({ bind: (...args: unknown[]) => ({ sql, args }) }),
      batch: async (stmts: { sql: string; args: unknown[] }[]) => {
        calls.push(stmts);
        return [];
      },
    };
    return { db: db as unknown as D1Database, calls };
  }

  it("replaces a school's ispp facts in one batch", async () => {
    const { db, calls } = fakeDb();
    const out = await importIsppFacts(db, [{ slug: "dais", website: "https://www.daischina.org/", ispp_school_id: dais.schoolId }], async () => [dais]);
    expect(out).toEqual(["dais: 5 facts"]);
    expect(calls).toHaveLength(1);
    expect(calls[0]![0]!.sql).toMatch(/^DELETE FROM facts WHERE school_slug = \? AND source_kind = 'ispp_api'/);
    expect(calls[0]!.slice(1).every((s) => s.sql.includes("'ispp_api'"))).toBe(true);
  });

  it("deletes nothing when myispp data cannot be fetched", async () => {
    const { db, calls } = fakeDb();
    await expect(
      importIsppFacts(db, [{ slug: "dais", website: "https://www.daischina.org/", ispp_school_id: dais.schoolId }], async () => {
        throw new Error("myispp data returned 503");
      }),
    ).rejects.toThrow("503");
    expect(calls).toHaveLength(0);
  });
});
