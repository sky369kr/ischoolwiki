import { describe, expect, it } from "vitest";
import { filterGrounded, parseFeed } from "../src/collect";

describe("parseFeed", () => {
  it("reads RSS items", () => {
    const xml = `<rss><channel><item><title><![CDATA[IB results 2026]]></title><link>https://school.example/news/ib</link><pubDate>Tue, 07 Jul 2026 08:00:00 GMT</pubDate><description>&lt;p&gt;Our students &amp; staff&lt;/p&gt;</description></item></channel></rss>`;
    expect(parseFeed(xml)).toEqual([
      { url: "https://school.example/news/ib", title: "IB results 2026", summary: "Our students & staff", published_at: "2026-07-07T08:00:00.000Z" },
    ]);
  });

  it("reads Atom entries with href links", () => {
    const xml = `<feed><entry><title>New campus</title><link href="https://school.example/campus"/><updated>2026-09-01T00:00:00Z</updated></entry></feed>`;
    expect(parseFeed(xml)[0]?.url).toBe("https://school.example/campus");
  });
});

describe("filterGrounded", () => {
  const page = "This year our Diploma students achieved an average of 36.5 points. Two graduates will start at Imperial College London.";

  it("keeps facts whose quote is on the page and contains the value", () => {
    const r = filterGrounded(
      {
        facts: [{ key: "ib_average", value: "36.5", unit: "points", quote: "achieved an average of 36.5 points" }],
        names: [{ name: "Imperial College London", quote: "Two graduates will start at Imperial College London" }],
      },
      page,
    );
    expect(r.facts).toHaveLength(1);
    expect(r.names).toEqual(["Imperial College London"]);
  });

  it("drops a fact whose quote was paraphrased or whose value differs", () => {
    const r = filterGrounded(
      {
        facts: [
          { key: "ib_average", value: "37", unit: "points", quote: "achieved an average of 36.5 points" },
          { key: "ib_average", value: "36.5", unit: "points", quote: "students averaged 36.5 points" },
        ],
        names: [{ name: "Oxford", quote: "Two graduates will start at Oxford" }],
      },
      page,
    );
    expect(r.facts).toEqual([]);
    expect(r.names).toEqual([]);
  });
});
