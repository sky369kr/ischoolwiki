import { describe, expect, it } from "vitest";
import { summarize, tuitionText } from "../src/summary";

const fee = (id: number, key: string, value: string, unit: string) => ({ id, key, value, unit, as_of: "2026/27", source_url: "https://school.example/fees.pdf" });

describe("summarize", () => {
  it("takes the tuition range and year groups from regular annual tuition rows only", () => {
    const s = summarize([
      fee(1, "annual_tuition_pre_nursery_mornings", "166,000", "RMB per year, 2026-2027, Pre-Nursery Mornings (age 1 on 1 September)"),
      fee(2, "annual_tuition_early_bird_pre_nursery_mornings", "161,020", "RMB per year if paid in full by 6 June 2026, 2026-2027, Pre-Nursery Mornings"),
      fee(3, "annual_tuition_year_13", "369,000", "RMB per year, 2026-2027, Year 13 (age 17 on 1 September)"),
    ]);
    expect(s.tuition).toMatchObject({ currency: "RMB", min: 166000, max: 369000 });
    expect(s.grades).toBe("Pre-Nursery – Year 13");
    expect(tuitionText(s.tuition!)).toBe("RMB 166,000 – 369,000 per year (2026/27)");
  });

  it("joins grade bands into one range", () => {
    const s = summarize([
      fee(1, "annual_tuition_kindergarten_grade_5", "210,000", "CNY per year, 2026/27, Kindergarten – Grade 5"),
      fee(2, "annual_tuition_grade_9_grade_12", "260,000", "CNY per year, 2026/27, Grade 9 – Grade 12"),
    ]);
    expect(s.grades).toBe("Kindergarten – Grade 12");
  });

  it("shows nothing it cannot support", () => {
    const s = summarize([
      fee(1, "annual_tuition_a", "100", "USD per year, 2026, Grade 1"),
      fee(2, "annual_tuition_b", "200", "EUR per year, 2026, Grade 2"),
      { key: "news", value: "Our GCSE results and a talk on Diploma courses", unit: null, as_of: null, source_url: "x" },
    ]);
    expect(s.tuition).toBeNull();
    expect(s.grades).toBeNull();
    expect(s.programmes).toEqual([]);
  });

  it("names programmes only when a fact value names them", () => {
    const s = summarize([
      { key: "programmes_offered", value: "Early Years Primary IGCSE IB Diploma A levels", unit: null, as_of: null, source_url: "x" },
      { key: "offers_ap_courses", value: "Advanced Placement (AP) courses", unit: null, as_of: null, source_url: "x" },
    ]);
    expect(s.programmes).toEqual(["IB Diploma", "IGCSE", "A Level", "AP"]);
  });
});
