import { describe, expect, it } from "vitest";
import { canRevise, pageOutcome, sourcesFor, usedNews } from "../src/pipeline";

describe("canRevise", () => {
  it("sends sentence-level problems back for one repair pass", () => {
    expect(canRevise([{ kind: "unsupported_claim", detail: '"autumn term": not in the material' }, { kind: "unknown_entity", detail: '"AI"' }])).toBe(true);
  });

  it("holds without revising when a problem cannot be repaired sentence by sentence", () => {
    expect(canRevise([])).toBe(false);
    expect(canRevise([{ kind: "duplicate", detail: "same title as article 3" }])).toBe(false);
    expect(canRevise([{ kind: "empty", detail: "body is 100 chars" }, { kind: "unknown_entity", detail: '"X"' }])).toBe(false);
    expect(canRevise([{ kind: "unsupported_claim", detail: "grounding check could not run (timeout); held for review" }])).toBe(false);
  });
});

describe("pageOutcome", () => {
  it("tries a page again after a temporary failure", () => {
    for (const status of [null, 408, 429, 500, 502, 503]) expect(pageOutcome(status)).toBe("retry");
  });
  it("reads a page that answered, and gives up on one that is gone", () => {
    expect(pageOutcome(200)).toBe("read");
    expect(pageOutcome(404)).toBe("skip");
    expect(pageOutcome(410)).toBe("skip");
  });
});

describe("usedNews", () => {
  const offered = [
    { id: 1, url: "https://school.example/news/fees" },
    { id: 2, url: "https://school.example/news/art-exhibition" },
    { id: 3, url: "https://school.example/news/swim-gala" },
  ];
  it("keeps only the news items the writer says the article draws on (B-01)", () => {
    expect(usedNews(offered, ["https://school.example/news/swim-gala"]).map((n) => n.id)).toEqual([3]);
    expect(usedNews(offered, [" https://school.example/news/fees ", "https://school.example/news/swim-gala"]).map((n) => n.id)).toEqual([1, 3]);
  });
  it("uses no news item when the article draws on none, or names a url that was not offered", () => {
    expect(usedNews(offered, [])).toEqual([]);
    expect(usedNews(offered, ["https://school.example/news/made-up", "https://school.example/news/art"])).toEqual([]);
  });
});

describe("sourcesFor", () => {
  const fact = (id: number, source_url: string) => ({ id, key: `k${id}`, value: "v", unit: null, source_url, quote: null });
  const camp = "https://school.example/news/make-create-camp";
  const football = "https://school.example/news/football-camp";
  const garden = "https://school.example/news/garden";
  const feesPdf = "https://school.example/fees.pdf";
  const facts = [fact(1, camp), fact(2, football), fact(3, garden), fact(4, feesPdf)];
  const newsPages = new Set([camp, football, garden]);

  it("leaves out another news page whose fact only matched by a shared number or phrase (B-01)", () => {
    expect(sourcesFor(facts, [1, 2, 3], [camp], newsPages)).toEqual([camp]);
  });
  it("keeps a fact page that is not a news item, such as a fee document", () => {
    expect(sourcesFor(facts, [1, 4], [camp], newsPages)).toEqual([camp, feesPdf]);
    expect(sourcesFor(facts, [4], [], newsPages)).toEqual([feesPdf]);
  });
  it("keeps every matched fact page for a guide, which passes no news pages", () => {
    expect(sourcesFor(facts, [2, 4], [])).toEqual([football, feesPdf]);
  });
  it("adds the fact pages the writer names, even when no number or phrase matched them (B-02)", () => {
    const secondary = "https://school.example/secondary";
    const withPages = [...facts, fact(5, secondary)];
    expect(sourcesFor(withPages, [1], [camp], newsPages, [secondary])).toEqual([camp, secondary]);
  });
  it("ignores a named page that is no fact's source", () => {
    expect(sourcesFor(facts, [1], [camp], newsPages, ["https://school.example/made-up"])).toEqual([camp]);
  });
  it("keeps a news page the writer names, though only its facts were used, not its news item (B-02)", () => {
    expect(sourcesFor(facts, [1, 3], [camp], newsPages, [football])).toEqual([camp, football]);
  });
});
