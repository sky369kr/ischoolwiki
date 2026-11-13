// Topic guides: reference articles written from a school's recorded facts on one topic, for days
// when there is no new school news to write about. Each topic is tried once per school
// (guide_attempts), whether the article passes, is held, or the writer skips it.
import type { FactRow } from "./verify";

export interface GuideTopic {
  id: string;
  // What the article should cover, as told to the writer.
  brief: string;
  // A fact belongs to the topic when its key matches and it is not excluded.
  match: RegExp;
  exclude?: RegExp;
}

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "fees",
    brief: "tuition and fees for the school year the facts give: annual tuition by year group, one-time charges, discounts and other charges the school lists",
    match: /tuition|fee|deposit|discount|bus|lunch|charge/,
  },
  {
    id: "programmes",
    brief: "the programmes, curricula and academic pathways the school says it offers",
    match: /curricul|programme|program|pathway|(^|_)ap(_|$)|a_level|(^|_)ib(_|$)|igcse|subject|course/,
    exclude: /tuition|fee|discount|boarding/,
  },
  {
    id: "boarding",
    brief: "boarding at the school: the options, supervision, meals and other arrangements the school states",
    match: /boarding/,
  },
  {
    id: "admissions",
    brief: "admissions: who the school or a programme is for, application and registration charges, deposits and admissions contacts the school publishes",
    match: /admission|application|enrol|registration|entry|target_students|deposit/,
  },
];

// Fewer facts than this and a guide would be a paragraph dressed up as an article.
export const MIN_GUIDE_FACTS = 3;

export function topicFacts(topic: GuideTopic, facts: FactRow[]): FactRow[] {
  return facts.filter((f) => topic.match.test(f.key) && !(topic.exclude && topic.exclude.test(f.key)));
}

// The first topic, in GUIDE_TOPICS order, not yet attempted for this school and with enough facts.
export function pickGuideTopic(facts: FactRow[], attempted: Set<string>): { topic: GuideTopic; facts: FactRow[] } | null {
  for (const topic of GUIDE_TOPICS) {
    if (attempted.has(topic.id)) continue;
    const own = topicFacts(topic, facts);
    if (own.length >= MIN_GUIDE_FACTS) return { topic, facts: own };
  }
  return null;
}
