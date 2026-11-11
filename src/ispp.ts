// Basic school facts from myispp.com's school database (the static /data/master.json that the
// myispp.com front end reads; the ispp-school-api Worker serves posts and members, not schools).
// Read-only: nothing here writes to myispp.com.
//
// Only fee data is taken, and only when the record names a source URL on the school's own
// domain. Estimates (tuitionRange/tuitionNote), computed totals and fields without a source are
// left out, because articles may state nothing that cannot be traced to a source.

export const ISPP_MASTER_URL = "https://myispp.com/data/master.json";

interface IsppAmount {
  name?: string;
  nameEn?: string;
  amount?: number | null;
}

interface IsppFees {
  currency?: string;
  year?: string;
  source?: string;
  tuition?: { grade?: string; annual?: number | null; annualFee?: number | null }[];
  oneTimeFees?: IsppAmount[];
  additionalFees?: IsppAmount[];
  discounts?: { name?: string; nameEn?: string; rate?: string }[];
}

export interface IsppSchool {
  schoolId: string;
  status?: string;
  isdFees?: IsppFees;
}

export interface IsppFact {
  key: string;
  value: string;
  unit: string;
  as_of: string | null;
  source_url: string;
}

export type IsppResult = { facts: IsppFact[]; skipped: null } | { facts: []; skipped: string };

export function factsFromIspp(rec: IsppSchool | undefined, schoolWebsite: string | null): IsppResult {
  const skip = (why: string): IsppResult => ({ facts: [], skipped: why });
  if (!rec) return skip("not in myispp data");
  if (rec.status !== "verified") return skip(`myispp status is ${rec.status ?? "missing"}, not verified`);
  const fees = rec.isdFees;
  if (!fees) return skip("no fee data");
  const source = httpsUrl(fees.source);
  if (!source) return skip("fee source is not a URL");
  const site = httpsUrl(schoolWebsite);
  if (!site || !sameSite(source.hostname, site.hostname)) return skip(`fee source ${source.hostname} is not the school's own site`);
  const currency = fees.currency ?? "";
  if (!/^[A-Z]{3}$/.test(currency)) return skip("fee currency missing");

  const year = fees.year?.trim() || null;
  const tag = (label: string) => [currency, year, label].filter(Boolean).join(", ");
  const facts: IsppFact[] = [];
  const add = (key: string, value: string, unit: string) => facts.push({ key, value, unit, as_of: year, source_url: source.href });

  for (const t of fees.tuition ?? []) {
    const grade = englishLabel(t.grade);
    const amount = t.annual ?? t.annualFee;
    if (!grade || !isAmount(amount)) continue;
    add(`annual_tuition_${snake(grade)}`, money(amount), `${currency} per year, ${[year, grade].filter(Boolean).join(", ")}`);
  }
  for (const [prefix, list] of [["one_time_fee", fees.oneTimeFees], ["additional_fee", fees.additionalFees]] as const) {
    for (const f of list ?? []) {
      const label = englishLabel(f.nameEn ?? f.name);
      if (!label || !isAmount(f.amount)) continue;
      add(`${prefix}_${snake(label)}`, money(f.amount), tag(label));
    }
  }
  for (const d of fees.discounts ?? []) {
    const label = englishLabel(d.nameEn ?? d.name);
    const rate = d.rate?.trim().match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (!label || !rate) continue;
    add(`discount_${snake(label)}`, rate[1]!, `%, ${[year, label].filter(Boolean).join(", ")}`);
  }
  return facts.length ? { facts, skipped: null } : skip("no fee items with amounts");
}

/** Replaces each listed school's ispp_api facts with what myispp.com currently says. */
export async function importIsppFacts(
  db: D1Database,
  schools: { slug: string; website: string | null; ispp_school_id: string | null }[],
  fetchMaster: () => Promise<IsppSchool[]>,
): Promise<string[]> {
  const linked = schools.filter((s) => s.ispp_school_id);
  if (!linked.length) return ["no schools linked to myispp"];
  // Fetch first: if myispp.com is unreachable nothing is deleted.
  const byId = new Map((await fetchMaster()).map((r) => [r.schoolId, r]));
  const out: string[] = [];
  for (const s of linked) {
    const r = factsFromIspp(byId.get(s.ispp_school_id!), s.website);
    await db.batch([
      db.prepare("DELETE FROM facts WHERE school_slug = ? AND source_kind = 'ispp_api'").bind(s.slug),
      ...r.facts.map((f) =>
        db.prepare(
          "INSERT OR IGNORE INTO facts (school_slug, key, value, unit, as_of, source_url, source_kind) VALUES (?, ?, ?, ?, ?, ?, 'ispp_api')",
        ).bind(s.slug, f.key, f.value, f.unit, f.as_of, f.source_url),
      ),
    ]);
    out.push(`${s.slug}: ${r.skipped ? `0 facts (${r.skipped})` : `${r.facts.length} facts`}`);
  }
  return out;
}

export async function fetchIsppMaster(userAgent: string): Promise<IsppSchool[]> {
  const res = await fetch(ISPP_MASTER_URL, { headers: { "user-agent": userAgent, accept: "application/json" } });
  if (!res.ok) throw new Error(`myispp data returned ${res.status}`);
  const body = (await res.json()) as { schools?: IsppSchool[] };
  if (!Array.isArray(body.schools)) throw new Error("myispp data has no schools list");
  return body.schools;
}

function httpsUrl(s: string | null | undefined): URL | null {
  try {
    const u = new URL((s ?? "").trim());
    return u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

function sameSite(a: string, b: string): boolean {
  const strip = (h: string) => h.toLowerCase().replace(/^www\./, "");
  const [x, y] = [strip(a), strip(b)];
  return x === y || x.endsWith(`.${y}`) || y.endsWith(`.${x}`);
}

/** English label or null; Korean-only names are dropped rather than translated. */
function englishLabel(s: string | undefined): string | null {
  const t = (s ?? "").trim();
  return t && /^[\x20-\x7E–—]+$/.test(t) && /[A-Za-z]/.test(t) ? t : null;
}

function isAmount(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

function money(n: number): string {
  return n.toLocaleString("en-US");
}

function snake(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
