import { runPipeline, unpublish, type Env, type School } from "./pipeline";
import { esc, markdownToHtml, page } from "./render";

interface ArticleRow {
  id: number;
  school_slug: string;
  lang: string;
  translation_of: number | null;
  slug: string;
  kind: string;
  title: string;
  tldr: string;
  body_md: string;
  faq_json: string;
  sources_json: string;
  published_at: string;
}

const LANGS = ["en", "ko"] as const;
const AI_CRAWLERS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Bingbot", "CCBot"];

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    try {
      if (url.pathname.startsWith("/admin/")) return await admin(req, env, url);
      return await site(env, url);
    } catch (err) {
      console.error(err);
      return new Response("Server error", { status: 500 });
    }
  },
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runPipeline(env).then((r) => console.log(JSON.stringify(r))));
  },
} satisfies ExportedHandler<Env>;

async function site(env: Env, url: URL): Promise<Response> {
  const s = { url: env.SITE_URL, name: env.SITE_NAME };
  const p = url.pathname;
  let m: RegExpMatchArray | null;

  if (p === "/robots.txt") {
    const lines = ["User-agent: *", "Allow: /", "Disallow: /admin/", "", ...AI_CRAWLERS.flatMap((b) => [`User-agent: ${b}`, "Allow: /", ""]), `Sitemap: ${env.SITE_URL}/sitemap.xml`];
    return text(lines.join("\n"));
  }
  if (p === "/sitemap.xml") return xml(await sitemap(env));
  if (p === "/rss.xml") return xml(await rss(env));
  if (p === "/llms.txt") return text(await llmsTxt(env));
  if (p === "/") return html(await home(env, s));
  if ((m = p.match(/^\/(?:(ko)\/)?blog\/?$/))) return html(await blogIndex(env, s, m[1] ?? "en"));
  if ((m = p.match(/^\/(?:(ko)\/)?blog\/([a-z0-9-]+)\/?$/))) return html(await articlePage(env, s, m[1] ?? "en", m[2]!));
  if ((m = p.match(/^\/wiki\/([a-z0-9-]+)\/?$/))) return html(await wikiPage(env, s, m[1]!));
  if ((m = p.match(/^\/compare\/([a-z0-9-]+)-international-schools\/?$/))) return html(await comparePage(env, s, m[1]!));
  return notFound(s);
}

type Site = { url: string; name: string };

async function published(env: Env, sql: string, ...params: unknown[]): Promise<ArticleRow[]> {
  return (await env.DB.prepare(`SELECT * FROM articles WHERE status = 'published' ${sql}`).bind(...params).all<ArticleRow>()).results;
}

async function home(env: Env, s: Site): Promise<string> {
  const { results: cities } = await env.DB.prepare(
    "SELECT city, city_slug, country, COUNT(*) AS n FROM schools WHERE active = 1 GROUP BY city_slug ORDER BY country, city",
  ).all<{ city: string; city_slug: string; country: string; n: number }>();
  const latest = await published(env, "AND lang = 'en' ORDER BY published_at DESC LIMIT 10");
  const body = `<h1>International schools in Asia, school by school</h1>
<p>Profiles, city comparisons and articles drawn from what each school publishes, with sources listed on every page.</p>
<h2>Compare by city</h2><ul class="plain">${cities.map((c) => `<li><a href="/compare/${c.city_slug}-international-schools">International schools in ${esc(c.city)}, ${esc(c.country)}</a> <span class="meta">${c.n} schools</span></li>`).join("")}</ul>
<h2>Latest articles</h2>${articleList(latest, "en")}`;
  return page({ site: s, lang: "en", path: "/", title: "International schools in Asia", description: "Profiles, city comparisons and articles about international schools in Asia, with sources." }, body);
}

function articleList(rows: ArticleRow[], lang: string): string {
  if (!rows.length) return `<p class="meta">${lang === "ko" ? "아직 게시된 글이 없습니다." : "No articles yet."}</p>`;
  const prefix = lang === "en" ? "" : `/${lang}`;
  return `<ul class="plain">${rows.map((a) => `<li><a href="${prefix}/blog/${a.slug}">${esc(a.title)}</a><div class="meta">${esc(a.tldr)}</div></li>`).join("")}</ul>`;
}

async function blogIndex(env: Env, s: Site, lang: string): Promise<string> {
  const rows = await published(env, "AND lang = ? ORDER BY published_at DESC LIMIT 100", lang);
  const title = lang === "ko" ? "국제학교 글 모음" : "Articles";
  return page(
    { site: s, lang, path: lang === "en" ? "/blog/" : `/${lang}/blog/`, title, description: title, alternates: LANGS.map((l) => ({ lang: l, path: l === "en" ? "/blog/" : `/${l}/blog/` })) },
    `<h1>${esc(title)}</h1>${articleList(rows, lang)}`,
  );
}

async function articlePage(env: Env, s: Site, lang: string, slug: string): Promise<string> {
  const [a] = await published(env, "AND lang = ? AND slug = ?", lang, slug);
  if (!a) return notFoundBody(s);
  const school = await env.DB.prepare("SELECT * FROM schools WHERE slug = ?").bind(a.school_slug).first<School>();
  const faq = JSON.parse(a.faq_json) as { question: string; answer: string }[];
  const sources = JSON.parse(a.sources_json) as string[];
  const siblings = await published(env, "AND slug = ?", slug);
  const path = (l: string) => (l === "en" ? `/blog/${slug}` : `/${l}/blog/${slug}`);
  const canonical = s.url + path(lang);
  const schema = [
    {
      "@context": "https://schema.org", "@type": "BlogPosting", headline: a.title, description: a.tldr, inLanguage: lang,
      datePublished: a.published_at.replace(" ", "T") + "Z", mainEntityOfPage: canonical,
      publisher: { "@type": "Organization", name: s.name, url: s.url },
      about: school ? { "@type": "EducationalOrganization", name: school.name, address: { "@type": "PostalAddress", addressLocality: school.city, addressCountry: school.country } } : undefined,
      citation: sources,
      speakable: { "@type": "SpeakableSpecification", cssSelector: [".tldr"] },
    },
    faq.length ? { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) } : null,
    school ? {
      "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: s.name, item: s.url + "/" },
        { "@type": "ListItem", position: 2, name: school.name, item: `${s.url}/wiki/${school.slug}` },
        { "@type": "ListItem", position: 3, name: a.title, item: canonical },
      ],
    } : null,
  ].filter(Boolean);
  const labels = lang === "ko" ? { faq: "자주 묻는 질문", sources: "출처", about: "학교 개요" } : { faq: "Questions parents ask", sources: "Sources", about: "School profile" };
  const body = `<article>
<h1>${esc(a.title)}</h1>
<p class="meta">${esc(a.published_at.slice(0, 10))}${school ? ` · <a href="/wiki/${school.slug}">${esc(school.name)}</a>` : ""}</p>
<p class="tldr">${esc(a.tldr)}</p>
${markdownToHtml(a.body_md)}
${faq.length ? `<h2>${labels.faq}</h2>${faq.map((f) => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join("")}` : ""}
<h2>${labels.sources}</h2><ul class="sources">${sources.map((u) => `<li><a href="${esc(u)}" rel="nofollow noopener">${esc(u)}</a></li>`).join("")}</ul>
</article>`;
  return page({ site: s, lang, path: path(lang), title: a.title, description: a.tldr, schema, alternates: siblings.map((x) => ({ lang: x.lang, path: path(x.lang) })) }, body);
}

async function wikiPage(env: Env, s: Site, slug: string): Promise<string> {
  const school = await env.DB.prepare("SELECT * FROM schools WHERE slug = ? AND active = 1").bind(slug).first<School>();
  if (!school) return notFoundBody(s);
  const { results: facts } = await env.DB.prepare(
    "SELECT key, value, unit, as_of, source_url FROM facts WHERE school_slug = ? ORDER BY key, as_of DESC",
  ).bind(slug).all<{ key: string; value: string; unit: string | null; as_of: string | null; source_url: string }>();
  const articles = await published(env, "AND lang = 'en' AND school_slug = ? ORDER BY published_at DESC LIMIT 20", slug);
  const schema = [{
    "@context": "https://schema.org", "@type": "EducationalOrganization", name: school.name, url: school.website ?? undefined,
    sameAs: school.website ? [school.website] : undefined,
    address: { "@type": "PostalAddress", addressLocality: school.city, addressCountry: school.country },
  }];
  const body = `<h1>${esc(school.name)}</h1>
<p class="meta">${esc(school.city)}, ${esc(school.country)}${school.website ? ` · <a href="${esc(school.website)}" rel="noopener">Official website</a>` : ""} · <a href="/compare/${school.city_slug}-international-schools">Compare schools in ${esc(school.city)}</a></p>
<h2>Key facts</h2>
${facts.length ? `<div class="scroll"><table><thead><tr><th>Item</th><th>Value</th><th>As of</th><th>Source</th></tr></thead><tbody>${facts.map((f) => `<tr><td>${esc(humanKey(f.key))}</td><td>${esc(f.value)}${f.unit ? ` ${esc(f.unit)}` : ""}</td><td>${esc(f.as_of?.slice(0, 10) ?? "")}</td><td><a href="${esc(f.source_url)}" rel="nofollow noopener">link</a></td></tr>`).join("")}</tbody></table></div>` : `<p class="meta">No verified facts recorded yet.</p>`}
<h2>Articles</h2>${articleList(articles, "en")}`;
  return page({ site: s, lang: "en", path: `/wiki/${slug}`, title: school.name, description: `${school.name}, ${school.city}: key facts with sources and articles.`, schema }, body);
}

async function comparePage(env: Env, s: Site, citySlug: string): Promise<string> {
  const { results: schools } = await env.DB.prepare("SELECT * FROM schools WHERE city_slug = ? AND active = 1 ORDER BY name").bind(citySlug).all<School>();
  if (!schools.length) return notFoundBody(s);
  const city = schools[0]!.city;
  const { results: facts } = await env.DB.prepare(
    `SELECT school_slug, key, value, unit FROM facts WHERE school_slug IN (${schools.map(() => "?").join(",")}) ORDER BY as_of DESC`,
  ).bind(...schools.map((x) => x.slug)).all<{ school_slug: string; key: string; value: string; unit: string | null }>();
  const bySchool = new Map<string, Map<string, string>>();
  for (const f of facts) {
    const m = bySchool.get(f.school_slug) ?? new Map<string, string>();
    if (!m.has(f.key)) m.set(f.key, f.unit ? `${f.value} ${f.unit}` : f.value);
    bySchool.set(f.school_slug, m);
  }
  const keyCounts = new Map<string, number>();
  for (const m of bySchool.values()) for (const k of m.keys()) keyCounts.set(k, (keyCounts.get(k) ?? 0) + 1);
  const keys = [...keyCounts].filter(([, n]) => n >= Math.min(2, schools.length)).map(([k]) => k).sort();
  const title = `International schools in ${city}`;
  const schema = [{
    "@context": "https://schema.org", "@type": "ItemList", name: title,
    itemListElement: schools.map((x, i) => ({ "@type": "ListItem", position: i + 1, url: `${s.url}/wiki/${x.slug}`, name: x.name })),
  }];
  const body = `<h1>${esc(title)}</h1>
<p>${schools.length} schools, listed alphabetically. Figures come from each school's published information; follow a school's profile for sources.</p>
<div class="scroll"><table><thead><tr><th>School</th>${keys.map((k) => `<th>${esc(humanKey(k))}</th>`).join("")}</tr></thead><tbody>
${schools.map((x) => `<tr><td><a href="/wiki/${x.slug}">${esc(x.name)}</a></td>${keys.map((k) => `<td>${esc(bySchool.get(x.slug)?.get(k) ?? "—")}</td>`).join("")}</tr>`).join("")}
</tbody></table></div>`;
  return page({ site: s, lang: "en", path: `/compare/${citySlug}-international-schools`, title, description: `${title}: a side-by-side comparison with sources.`, schema }, body);
}

function humanKey(k: string): string {
  const t = k.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

async function sitemap(env: Env): Promise<string> {
  const rows = await published(env, "ORDER BY published_at DESC");
  const { results: schools } = await env.DB.prepare("SELECT slug, city_slug FROM schools WHERE active = 1").all<{ slug: string; city_slug: string }>();
  const urls = [
    "/", "/blog/", "/ko/blog/",
    ...schools.map((x) => `/wiki/${x.slug}`),
    ...[...new Set(schools.map((x) => x.city_slug))].map((c) => `/compare/${c}-international-schools`),
    ...rows.map((a) => (a.lang === "en" ? `/blog/${a.slug}` : `/${a.lang}/blog/${a.slug}`)),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${esc(env.SITE_URL + u)}</loc></url>`).join("")}</urlset>`;
}

async function rss(env: Env): Promise<string> {
  const rows = await published(env, "AND lang = 'en' ORDER BY published_at DESC LIMIT 50");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>${esc(env.SITE_NAME)}</title><link>${esc(env.SITE_URL)}</link><description>Articles about international schools in Asia</description>${rows
    .map((a) => `<item><title>${esc(a.title)}</title><link>${esc(`${env.SITE_URL}/blog/${a.slug}`)}</link><guid>${esc(`${env.SITE_URL}/blog/${a.slug}`)}</guid><pubDate>${new Date(a.published_at.replace(" ", "T") + "Z").toUTCString()}</pubDate><description>${esc(a.tldr)}</description></item>`)
    .join("")}</channel></rss>`;
}

async function llmsTxt(env: Env): Promise<string> {
  const { results: schools } = await env.DB.prepare("SELECT slug, name, city FROM schools WHERE active = 1 ORDER BY city, name").all<{ slug: string; name: string; city: string }>();
  const rows = await published(env, "AND lang = 'en' ORDER BY published_at DESC LIMIT 100");
  return [
    `# ${env.SITE_NAME}`,
    "",
    "> Reference pages about international schools in Asia: school profiles with sourced facts, city comparisons, and articles. Every figure links to the school's own published source.",
    "",
    "## School profiles",
    ...schools.map((x) => `- [${x.name} (${x.city})](${env.SITE_URL}/wiki/${x.slug})`),
    "",
    "## Articles",
    ...rows.map((a) => `- [${a.title}](${env.SITE_URL}/blog/${a.slug}): ${a.tldr}`),
    "",
  ].join("\n");
}

async function admin(req: Request, env: Env, url: URL): Promise<Response> {
  if (!env.ADMIN_TOKEN || !(await sameSecret(req.headers.get("authorization") ?? "", `Bearer ${env.ADMIN_TOKEN}`))) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (req.method === "POST" && url.pathname === "/admin/run") return Response.json(await runPipeline(env));
  if (req.method === "POST" && url.pathname === "/admin/unpublish") {
    const body = (await req.json()) as { run_id?: string; article_id?: number; reason?: string };
    if (!body.run_id && typeof body.article_id !== "number") return new Response("run_id or article_id required", { status: 400 });
    return Response.json({ unpublished: await unpublish(env, body, body.reason ?? "admin request") });
  }
  if (req.method === "GET" && url.pathname === "/admin/held") {
    const { results } = await env.DB.prepare(
      `SELECT a.id, a.school_slug, a.lang, a.title, a.created_at, v.problems_json FROM articles a
       JOIN verification_results v ON v.article_id = a.id WHERE a.status = 'held' ORDER BY a.created_at DESC LIMIT 100`,
    ).all();
    return Response.json(results);
  }
  return new Response("Not found", { status: 404 });
}

async function sameSecret(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  return crypto.subtle.timingSafeEqual(ha, hb);
}

function notFoundBody(s: Site): string {
  return page({ site: s, lang: "en", path: "/404", title: "Page not found", description: "Page not found" }, "<h1>Page not found</h1><p><a href=\"/\">Back to the start</a></p>");
}

function notFound(s: Site): Response {
  return new Response(notFoundBody(s), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
}

function html(body: string): Response {
  const status = body.includes("<h1>Page not found</h1>") ? 404 : 200;
  return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
}

function xml(body: string): Response {
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}

function text(body: string): Response {
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
