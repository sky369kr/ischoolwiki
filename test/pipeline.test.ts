import { describe, expect, it } from "vitest";
import { canRevise, pageOutcome, usedNews } from "../src/pipeline";

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
