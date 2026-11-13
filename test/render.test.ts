import { describe, expect, it } from "vitest";
import { jsonLd, markdownToHtml } from "../src/render";

describe("markdownToHtml", () => {
  it("renders headings, paragraphs, lists, bold and links", () => {
    const html = markdownToHtml("## Results\n\nA **strong** year, see [report](https://school.example/r).\n\n1. Visit\n2. Apply\n\n- one\n- two");
    expect(html).toBe(
      [
        "<h2>Results</h2>",
        '<p>A <strong>strong</strong> year, see <a href="https://school.example/r" rel="nofollow noopener">report</a>.</p>',
        "<ol><li>Visit</li><li>Apply</li></ol>",
        "<ul><li>one</li><li>two</li></ul>",
      ].join("\n"),
    );
  });

  it("escapes raw HTML and refuses non-http links", () => {
    const html = markdownToHtml('<img src=x onerror=alert(1)> [x](javascript:alert(1)) [y](https://a.example/" onmouseover="x)');
    expect(html).not.toContain("<img");
    expect(html).not.toContain('href="javascript');
    expect(html).not.toMatch(/href="[^"]*" onmouseover/);
  });
});

describe("jsonLd", () => {
  it("cannot be closed early by a </script> inside the data", () => {
    expect(jsonLd({ headline: "</script><script>alert(1)</script>" })).not.toContain("</script><script>");
  });
});

describe("markdownToHtml tables", () => {
  it("renders a pipe table with a header and escapes cell text", () => {
    const html = markdownToHtml("Intro.\n\n| Item | Detail |\n|---|---|\n| Student | <b>x</b> |\n| Entries | About 8,000 |\n\nAfter.");
    expect(html).toBe(
      [
        "<p>Intro.</p>",
        '<div class="scroll"><table><thead><tr><th>Item</th><th>Detail</th></tr></thead><tbody><tr><td>Student</td><td>&lt;b&gt;x&lt;/b&gt;</td></tr><tr><td>Entries</td><td>About 8,000</td></tr></tbody></table></div>',
        "<p>After.</p>",
      ].join("\n"),
    );
  });

  it("leaves pipe lines without a separator row as text", () => {
    expect(markdownToHtml("| not | a table |")).toBe("<p>| not | a table |</p>");
  });
});
