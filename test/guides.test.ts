import { describe, expect, it } from "vitest";
import { GUIDE_TOPICS, pickGuideTopic, topicFacts } from "../src/guides";
import type { FactRow } from "../src/verify";

let id = 0;
const f = (key: string, value = "x"): FactRow => ({ id: ++id, key, value, unit: null, source_url: "https://school.example/", quote: null });
const topic = (tid: string) => GUIDE_TOPICS.find((t) => t.id === tid)!;

describe("topicFacts", () => {
  it("sorts facts into topics by key", () => {
    const facts = [
      f("annual_tuition_year_1"), f("one_time_fee_application_fee_non_refundable"), f("additional_fee_school_bus_dalian_city"),
      f("offers_ap_courses"), f("offers_a_level_pathway"), f("curriculum_offered"),
      f("boarding_supervision"), f("boarding_meals"),
      f("monster_mash_attendance"),
    ];
    expect(topicFacts(topic("fees"), facts).map((x) => x.key)).toEqual([
      "annual_tuition_year_1", "one_time_fee_application_fee_non_refundable", "additional_fee_school_bus_dalian_city",
    ]);
    expect(topicFacts(topic("programmes"), facts).map((x) => x.key)).toEqual(["offers_ap_courses", "offers_a_level_pathway", "curriculum_offered"]);
    expect(topicFacts(topic("boarding"), facts).map((x) => x.key)).toEqual(["boarding_supervision", "boarding_meals"]);
  });

  it("keeps fee rows out of the programmes guide", () => {
    expect(topicFacts(topic("programmes"), [f("annual_tuition_ib_diploma")])).toEqual([]);
  });
});

describe("pickGuideTopic", () => {
  const facts = [f("annual_tuition_a"), f("annual_tuition_b"), f("annual_tuition_c"), f("curriculum_offered"), f("offers_ap_courses"), f("ib_programme"), f("boarding_meals")];

  it("takes the first untried topic with enough facts", () => {
    expect(pickGuideTopic(facts, new Set())?.topic.id).toBe("fees");
    expect(pickGuideTopic(facts, new Set(["fees"]))?.topic.id).toBe("programmes");
  });

  it("does not write a guide from fewer than three facts, and gives up when every topic is tried or thin", () => {
    expect(pickGuideTopic(facts, new Set(["fees", "programmes"]))).toBeNull();
    expect(pickGuideTopic([], new Set())).toBeNull();
  });

  it("passes the writer only the topic's own facts", () => {
    expect(pickGuideTopic(facts, new Set())!.facts.every((x) => x.key.startsWith("annual_tuition_"))).toBe(true);
  });
});
