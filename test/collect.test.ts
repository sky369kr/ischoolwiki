import { describe, expect, it } from "vitest";
import { filterGrounded, parseFeed, parseNewsSource } from "../src/collect";

describe("parseNewsSource with an HTML news index", () => {
  const html = `
    <a href="/bsb-shunyi/news/2026/7/26/celebrating-exceptional-ibdp-results-at-bsb-shunyi"><span>Celebrating exceptional IBDP results</span></a>
    <a href="https://www.nordangliaeducation.com/bsb-shunyi/news/2026/7/26/celebrating-exceptional-ibdp-results-at-bsb-shunyi">Read more</a>
    <a href="https://www.nordangliaeducation.com/bsb-shunyi/news/2025/12/merry-christmas?x=1#top">Merry</a>
    <a href="/bsb-sanlitun/news/2026/1/1/other-school">Other campus</a>
    <a href="https://elsewhere.example/bsb-shunyi/news/2026/1/1/x">Off-site</a>
    <a href="/bsb-shunyi/about-us">About</a>`;

  it("keeps same-section article links with dates from the URL and the longest link text", () => {
    const items = parseNewsSource(html, "https://www.nordangliaeducation.com/bsb-shunyi/news-search?pageNum=1&type=news");
    expect(items).toEqual([
      {
        url: "https://www.nordangliaeducation.com/bsb-shunyi/news/2026/7/26/celebrating-exceptional-ibdp-results-at-bsb-shunyi",
        title: "Celebrating exceptional IBDP results",
        summary: null,
        published_at: "2026-07-26T00:00:00.000Z",
      },
      {
        url: "https://www.nordangliaeducation.com/bsb-shunyi/news/2025/12/merry-christmas",
        title: "merry christmas",
        summary: null,
        published_at: "2025-12-01T00:00:00.000Z",
      },
    ]);
  });

  it("treats a root news index as covering the whole site", () => {
    const items = parseNewsSource('<a href="/news/2026/11/10/yes-ai-no-ai">Yes AI, no AI: how students learn</a>', "https://www.daischina.org/news");
    expect(items.map((i) => i.url)).toEqual(["https://www.daischina.org/news/2026/11/10/yes-ai-no-ai"]);
  });
});

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
