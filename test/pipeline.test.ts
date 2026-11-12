import { describe, expect, it } from "vitest";
import { canRevise } from "../src/pipeline";

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
