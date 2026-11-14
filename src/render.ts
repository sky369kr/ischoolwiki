import { OPERATOR } from "./operator";

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function inline(s: string): string {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, text, url) => `<a href="${url}" rel="nofollow noopener">${text}</a>`);
}

export function markdownToHtml(md: string): string {
  const out: string[] = [];
  let list: { tag: "ul" | "ol"; items: string[] } | null = null;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`);
    list = null;
  };
  // Pipe tables: a header row, a separator row ("|---|---|"), then body rows. Without the separator
  // the lines are ordinary text.
  let table: string[] = [];
  const cells = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const flushTable = () => {
    if (!table.length) return;
    if (table.length >= 2 && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(table[1]!)) {
      const head = cells(table[0]!);
      const body = table.slice(2).map(cells);
      out.push(`<div class="scroll"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body
        .map((r) => `<tr>${head.map((_, i) => `<td>${inline(r[i] ?? "")}</td>`).join("")}</tr>`)
        .join("")}</tbody></table></div>`);
    } else {
      para.push(...table.map((l) => l.trim()));
      flushPara();
    }
    table = [];
  };
  for (const line of md.split("\n")) {
    if (/^\s*\|/.test(line)) {
      flushPara(); flushList();
      table.push(line);
      continue;
    }
    flushTable();
    const h = line.match(/^(#{2,4})\s+(.*)$/);
    const ul = line.match(/^\s*[-*+]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (h) {
      flushPara(); flushList();
      const level = Math.min(h[1]!.length, 4);
      out.push(`<h${level}>${inline(h[2]!)}</h${level}>`);
    } else if (ul || ol) {
      flushPara();
      const tag = ul ? "ul" : "ol";
      if (list && list.tag !== tag) flushList();
      list ??= { tag, items: [] };
      list.items.push((ul ?? ol)![1]!);
    } else if (!line.trim()) {
      flushPara(); flushList();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushTable(); flushPara(); flushList();
  return out.join("\n");
}

export function jsonLd(data: unknown): string {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

export interface PageMeta {
  site: { url: string; name: string };
  lang: string;
  path: string;
  title: string;
  description: string;
  alternates?: { lang: string; path: string }[];
  schema?: unknown[];
  wide?: boolean;
}

const STYLE = `
:root{--bg:#fbfaf7;--card:#ffffff;--fg:#1d2321;--muted:#5d6763;--line:#e2e0d8;--accent:#1f6f5c;--accent-soft:#e7f1ed;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#141816;--card:#1b201e;--fg:#e8ebe8;--muted:#9aa5a0;--line:#2b322f;--accent:#6fcfb4;--accent-soft:#1f2d28;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans KR",sans-serif}
.wrap{max-width:46rem;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left));padding-right:max(16px,env(safe-area-inset-right))}
body.wide .wrap{max-width:68rem}
header{border-bottom:1px solid var(--line);background:var(--card)}header .wrap{padding-block:.9rem;display:flex;gap:1.25rem;flex-wrap:wrap;align-items:center}
header a.home{font-weight:750;color:var(--fg);text-decoration:none;font-size:1.15rem;letter-spacing:-.01em}header a.home span{color:var(--accent)}
header nav{display:flex;gap:1rem;flex-wrap:wrap;font-size:.95rem}header nav a{color:var(--muted);text-decoration:none}header nav a:hover{color:var(--accent)}
main{padding-block:2rem 3rem}a{color:var(--accent)}
h1{font-size:clamp(1.7rem,4vw,2.3rem);line-height:1.15;letter-spacing:-.02em;text-wrap:balance;margin:0 0 .75rem}h2{font-size:1.3rem;margin:2.25rem 0 .75rem}h3{font-size:1.05rem;margin:1.5rem 0 .4rem}
article p,article li{font-family:Georgia,"Noto Serif KR",serif;font-size:1.06rem}
article .meta,article .notice,article .sources li{font-family:inherit}
.lead{font-size:1.1rem;color:var(--muted);max-width:40rem}
.notice{border:1px solid var(--line);border-radius:8px;padding:.6rem .8rem;color:var(--muted);font-size:14px;line-height:1.5}
.tldr{background:var(--accent-soft);border-radius:10px;padding:1rem 1.15rem;margin:1.25rem 0}.tldr b{display:block;font:600 12px/1.4 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);margin-bottom:.25rem}
.tldr p{margin:0;font-size:1.08rem}
.meta,.sources{color:var(--muted);font-size:14px;line-height:1.5}.sources a{overflow-wrap:anywhere}article{overflow-wrap:break-word}.crumbs{font-size:14px;color:var(--muted);margin-bottom:.75rem}.crumbs a{color:var(--muted)}
table{border-collapse:collapse;width:100%;font-size:15px;line-height:1.45}.scroll{overflow-x:auto}th,td{border-bottom:1px solid var(--line);padding:.5rem;text-align:left;vertical-align:top}
ul.plain{list-style:none;padding:0;margin:0}ul.plain li{padding:.75rem 0;border-bottom:1px solid var(--line)}ul.plain li>a{font-weight:600}
.grid{display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(19rem,1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:1.1rem 1.2rem;display:flex;flex-direction:column;gap:.55rem}
.card h3{margin:0;font-size:1.12rem;line-height:1.3}.card h3 a{color:var(--fg);text-decoration:none}.card h3 a:hover{color:var(--accent)}
.card dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:.2rem .8rem;font-size:14px;line-height:1.45}.card dt{color:var(--muted)}.card dd{margin:0}
.chips{display:flex;flex-wrap:wrap;gap:.35rem}.chip{font-size:12.5px;line-height:1;padding:.35rem .55rem;border-radius:999px;background:var(--accent-soft);color:var(--accent);font-weight:600}
.tag{font-size:12px;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:.15rem .5rem;align-self:flex-start}
.card .more{margin-top:auto;font-size:14px}
.trust{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));margin:2rem 0 0;padding:0;list-style:none}.trust li{border-top:2px solid var(--accent);padding-top:.6rem;font-size:15px;line-height:1.5}.trust b{display:block;margin-bottom:.15rem}
.infobox{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:.4rem 1rem;margin:1.25rem 0}.infobox table{font-size:15px}.infobox th{color:var(--muted);font-weight:500;width:9.5rem}.infobox tr:last-child th,.infobox tr:last-child td{border-bottom:0}
details{margin-top:1rem}summary{cursor:pointer;color:var(--accent);font-weight:600}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:14px;line-height:1.5}footer .wrap{padding-block:2rem}`;

export function page(meta: PageMeta, body: string): string {
  const canonical = meta.site.url + meta.path;
  const alts = (meta.alternates ?? [])
    .map((a) => `<link rel="alternate" hreflang="${esc(a.lang)}" href="${esc(meta.site.url + a.path)}">`)
    .join("");
  return `<!doctype html>
<html lang="${esc(meta.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(meta.title)} | ${esc(meta.site.name)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${esc(canonical)}">${alts}
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:type" content="article">
<link rel="alternate" type="application/rss+xml" href="${esc(meta.site.url)}/rss.xml">
<style>${STYLE}</style>
${(meta.schema ?? []).map(jsonLd).join("\n")}
</head>
<body${meta.wide ? ' class="wide"' : ""}>
<header><div class="wrap"><a class="home" href="${meta.lang === "ko" ? "/ko/blog/" : "/"}">${brand(meta.site.name)}</a><nav>${meta.lang === "ko"
    ? `<a href="/ko/blog/">글 모음</a><a href="/">English</a><a href="/ko/about">운영자 정보</a>`
    : `<a href="/#schools">Schools</a><a href="/blog/">Articles</a><a href="/about">About</a><a href="/ko/blog/">한국어</a>`}</nav></div></header>
<main class="wrap">${body}</main>
<footer><div class="wrap">${meta.lang === "ko"
    ? `${esc(meta.site.name)}는 학교가 공개한 자료로 작성한 국제학교 참고 사이트이며, 글마다 출처를 밝힙니다. 운영: ${esc(OPERATOR.name)} (${esc(OPERATOR.brand)}) · <a href="/ko/about">운영자 정보</a>`
    : `${esc(meta.site.name)} publishes reference pages about international schools, written from schools' published information; each page lists its sources. Operated by ${esc(OPERATOR.name)} (${esc(OPERATOR.brand)}) · <a href="/about">About</a>`}</div></footer>
</body>
</html>`;
}

// "iSchoolWiki" with "Wiki" in the accent colour; any other name is shown as is.
function brand(name: string): string {
  const m = name.match(/^(.*)(Wiki)$/);
  return m ? `${esc(m[1]!)}<span>${m[2]}</span>` : esc(name);
}
