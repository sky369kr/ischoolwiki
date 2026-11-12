// A school's headline facts for cards and the profile infobox, computed only from recorded facts:
// nothing here is estimated or filled in. A field is null (and not shown) when no fact supports it.

export interface SummaryFact {
  id?: number;
  key: string;
  value: string;
  unit: string | null;
  as_of: string | null;
  source_url: string;
}

export interface SchoolSummary {
  programmes: string[];
  tuition: { currency: string; min: number; max: number; year: string | null; source_url: string } | null;
  grades: string | null;
}

// Programme names shown only when a fact's value names them.
const PROGRAMMES: [string, RegExp][] = [
  ["IB Diploma", /\bIB\s*Diploma\b|\bIBDP\b/i],
  ["IB MYP", /\bIB\s*MYP\b|\bMiddle Years Programme\b/i],
  ["IB PYP", /\bIB\s*PYP\b|\bPrimary Years Programme\b/i],
  ["IGCSE", /\bIGCSEs?\b/],
  ["A Level", /\bA[- ]?Levels?\b/i],
  ["AP", /\bAdvanced Placement\b/i],
];

export function summarize(facts: SummaryFact[]): SchoolSummary {
  const programmes = PROGRAMMES.filter(([, re]) => facts.some((f) => re.test(f.value))).map(([name]) => name);

  // Regular annual tuition rows; early-payment discounts are a different price and are left out.
  const tuitionRows = facts
    .filter((f) => /^annual_tuition_/.test(f.key) && !/early_bird/.test(f.key))
    .map((f) => ({ f, amount: Number(f.value.replace(/,/g, "")), currency: (f.unit ?? "").match(/^[A-Z]{3}\b/)?.[0] }))
    .filter((r): r is { f: SummaryFact; amount: number; currency: string } => Number.isFinite(r.amount) && r.amount > 0 && !!r.currency);
  const currencies = new Set(tuitionRows.map((r) => r.currency));
  let tuition: SchoolSummary["tuition"] = null;
  let grades: string | null = null;
  if (tuitionRows.length && currencies.size === 1) {
    const amounts = tuitionRows.map((r) => r.amount);
    tuition = {
      currency: tuitionRows[0]!.currency,
      min: Math.min(...amounts),
      max: Math.max(...amounts),
      year: tuitionRows[0]!.f.as_of,
      source_url: tuitionRows[0]!.f.source_url,
    };
    // Fee schedules list year groups youngest first; the range runs from the first to the last label.
    const ordered = [...tuitionRows].sort((a, b) => (a.f.id ?? 0) - (b.f.id ?? 0));
    const first = gradeLabel(ordered[0]!.f.unit);
    const last = gradeLabel(ordered[ordered.length - 1]!.f.unit);
    if (first && last) {
      const from = first.split(/\s+[–-]\s+/)[0]!;
      const to = last.split(/\s+[–-]\s+/).pop()!;
      grades = from === to ? from : `${from} – ${to}`;
    }
  }
  return { programmes, tuition, grades };
}

// "RMB per year, 2026-2027, Pre-Nursery Mornings (age 1 on 1 September)" -> "Pre-Nursery"
function gradeLabel(unit: string | null): string | null {
  const label = (unit ?? "").split(",").pop()?.replace(/\(.*?\)/g, "").replace(/\b(Mornings|Afternoons|Full Day|Half Day)\b/gi, "").trim();
  return label || null;
}

export function formatAmount(n: number): string {
  return n.toLocaleString("en-US");
}

export function tuitionText(t: NonNullable<SchoolSummary["tuition"]>): string {
  const range = t.min === t.max ? formatAmount(t.min) : `${formatAmount(t.min)} – ${formatAmount(t.max)}`;
  return `${t.currency} ${range} per year${t.year ? ` (${t.year})` : ""}`;
}
