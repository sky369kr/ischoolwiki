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
  for (const line of md.split("\n")) {
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
  flushPara(); flushList();
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
}

const STYLE = `
:root{--bg:#fbfaf7;--fg:#1d2321;--muted:#5d6763;--line:#e2e0d8;--accent:#1f6f5c;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#141816;--fg:#e8ebe8;--muted:#9aa5a0;--line:#2b322f;--accent:#6fcfb4;color-scheme:dark}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:17px/1.65 Georgia,"Noto Serif KR",serif}
header,main,footer{max-width:46rem;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left));padding-right:max(16px,env(safe-area-inset-right))}
header{padding-block:1.25rem;border-bottom:1px solid var(--line);display:flex;gap:1rem;flex-wrap:wrap;align-items:baseline;font-family:system-ui,sans-serif}
header a.home{font-weight:700;color:var(--fg);text-decoration:none;font-size:1.1rem}header nav{display:flex;gap:1rem;font-size:.95rem}
main{padding-block:2rem}a{color:var(--accent)}h1{font-size:2rem;line-height:1.2;text-wrap:balance;margin:0 0 .75rem}h2{font-size:1.35rem;margin-top:2rem}
.notice{border:1px solid var(--line);border-radius:6px;padding:.6rem .8rem;color:var(--muted);font:14px/1.5 system-ui,sans-serif}
.tldr{border-left:3px solid var(--accent);padding:.25rem 0 .25rem 1rem;color:var(--fg);font-size:1.05rem}
.meta,.sources{color:var(--muted);font:14px/1.5 system-ui,sans-serif}table{border-collapse:collapse;width:100%;font:15px/1.45 system-ui,sans-serif}
.scroll{overflow-x:auto}th,td{border-bottom:1px solid var(--line);padding:.5rem;text-align:left;vertical-align:top}
ul.plain{list-style:none;padding:0}ul.plain li{padding:.5rem 0;border-bottom:1px solid var(--line)}
footer{padding-block:2rem;border-top:1px solid var(--line);color:var(--muted);font:14px/1.5 system-ui,sans-serif}`;

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
<body>
<header><a class="home" href="/">${esc(meta.site.name)}</a><nav><a href="/blog/">Articles</a><a href="/ko/blog/">한국어</a></nav></header>
<main>${body}</main>
<footer>${meta.lang === "ko"
    ? `${esc(meta.site.name)}는 학교가 공개한 자료로 작성한 아시아 국제학교 참고 사이트이며, 글마다 출처를 밝힙니다. 운영: ${esc(OPERATOR.name)} (${esc(OPERATOR.brand)}) · <a href="/ko/about">운영자 정보</a>`
    : `${esc(meta.site.name)} publishes reference pages about international schools in Asia, written from schools' published information; each page lists its sources. Operated by ${esc(OPERATOR.name)} (${esc(OPERATOR.brand)}) · <a href="/about">About</a>`}</footer>
</body>
</html>`;
}
