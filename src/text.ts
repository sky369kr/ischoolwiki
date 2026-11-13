// HTML entities as they appear in school pages. Typographic ones matter: "King&rsquo;s College London"
// must read as "King’s College London", or a name taken from a page cannot be matched later.
const NAMED: Record<string, string> = {
  quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", sbquo: "‚", bdquo: "„",
  ndash: "–", mdash: "—", hellip: "…", middot: "·", bull: "•", eacute: "é", egrave: "è", uuml: "ü", ouml: "ö", auml: "ä",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name: string) => NAMED[name.toLowerCase()] ?? m)
    .replace(/&amp;/g, "&");
}
