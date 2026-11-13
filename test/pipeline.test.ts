import { describe, expect, it } from "vitest";
import { canRevise, pageOutcome } from "../src/pipeline";

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
