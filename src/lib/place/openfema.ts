// OpenFEMA: flood insurance claims in the census tract, and federal disaster
// declarations for the county. https://www.fema.gov/about/openfema/data-sets
//   NfipClaims v3                     one row per claim, located to a census block group
//   DisasterDeclarationsSummaries v2  one row per declaration per county
//
// Where the answer comes from. The site keeps its own copy of both tables
// (src/data/fema, built by scripts/build-fema-tables.mjs) and reads that
// first: it is quick and it does not fail when FEMA's service is busy. FEMA
// is asked live only for a state the copy does not hold. Either way the
// result is summarised by the same code, and it says which it was (`copied`).
//
// What a claim count is and is not. Only homes with a National Flood Insurance
// Program policy can make a claim, and FEMA has not located every claim to a
// census area, so a low count does not mean no flooding; the card says both.
// Counts only: no dollar amounts are read or shown, because the product makes
// no statement about loss.

import { askJson, DAY_SECONDS, type Lookup } from "./lookup";
import { claimsFile, declarationsFile, tableNote, type DeclarationRow } from "./tables";

const BASE = "https://www.fema.gov/api/open";
const WHO = "FEMA's open data service";

/** OpenFEMA returns at most this many rows per request. */
const PAGE = 10_000;

export interface TractClaims {
  total: number;
  /** True when the tract has more claims than one live request returns. */
  atLeast: boolean;
  firstYear: number | null;
  lastYear: number | null;
  yearsWithClaims: number;
  /** The three years with the most claims, most first. */
  busiestYears: { year: number; claims: number }[];
  /** The day our copy of FEMA's table was taken (yyyy-mm-dd), or null when FEMA was asked live. */
  copied: string | null;
}

function summariseClaims(byYear: Map<number, number>, copied: string | null, atLeast = false): TractClaims {
  const years = [...byYear.keys()].sort((a, b) => a - b);
  let total = 0;
  for (const n of byYear.values()) total += n;
  return {
    total,
    atLeast,
    firstYear: years[0] ?? null,
    lastYear: years[years.length - 1] ?? null,
    yearsWithClaims: years.length,
    busiestYears: [...byYear.entries()]
      .sort((a, b) => b[1] - a[1] || b[0] - a[0])
      .slice(0, 3)
      .map(([year, claims]) => ({ year, claims })),
    copied,
  };
}

export async function claimsInTract(tractGeoid: string): Promise<Lookup<TractClaims>> {
  if (!/^\d{11}$/.test(tractGeoid)) return { ok: false, reason: "No census tract to look up." };

  const file = await claimsFile(tractGeoid.slice(0, 2));
  if (file) {
    const flat = file.tracts[tractGeoid] ?? [];
    const byYear = new Map<number, number>();
    for (let i = 0; i + 1 < flat.length; i += 2) byYear.set(flat[i], flat[i + 1]);
    return { ok: true, data: summariseClaims(byYear, tableNote("claims")?.copied ?? null) };
  }

  // censusGeoid is a block group (twelve digits); the tract is its first eleven.
  const filter = `startswith(censusGeoid,'${tractGeoid}')`;
  const url =
    `${BASE}/v3/NfipClaims?$filter=${encodeURIComponent(filter)}` +
    `&$select=yearOfLoss&$top=${PAGE}`;
  const res = await askJson<{ NfipClaims?: { yearOfLoss: number | null }[] }>(url, WHO, {
    revalidate: 7 * DAY_SECONDS,
    timeoutMs: 25_000,
    retries: 1,
  });
  if (!res.ok) return res;

  const rows = res.data.NfipClaims ?? [];
  const byYear = new Map<number, number>();
  for (const r of rows) {
    if (typeof r.yearOfLoss !== "number") continue;
    byYear.set(r.yearOfLoss, (byYear.get(r.yearOfLoss) ?? 0) + 1);
  }
  return { ok: true, data: summariseClaims(byYear, null, rows.length >= PAGE) };
}

/** Of every claim in our copy, the share FEMA has not located to a census
 *  area, as a whole percent. null when the copy does not record it. */
export function claimsNotLocatedPct(): number | null {
  const note = tableNote("claims");
  if (!note?.claimsRead || typeof note.claimsNotLocated !== "number") return null;
  return Math.round((note.claimsNotLocated / note.claimsRead) * 100);
}

export interface CountyDeclarations {
  total: number;
  firstYear: number | null;
  /** Declarations by FEMA's incident type, most first. */
  byType: { type: string; count: number }[];
  /** The five most recent, newest first. */
  recent: { title: string; type: string; date: string }[];
  /** The day our copy of FEMA's table was taken (yyyy-mm-dd), or null when FEMA was asked live. */
  copied: string | null;
}

/** Public-health declarations (the COVID-19 ones) are real declarations but
 *  say nothing about a place's environment, so they are left out of a page
 *  about flood, storm and heat. The card states the omission. */
const LEFT_OUT = new Set(["Biological"]);

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b([a-z])/g, (c) => c.toUpperCase())
    .replace(/\b(Of|And|The|In|On|At|For|To)\b/g, (w) => w.toLowerCase())
    .replace(/^./, (c) => c.toUpperCase());
}

/** Rows newest first, one per declaration. */
function summariseDeclarations(all: DeclarationRow[], copied: string | null): CountyDeclarations {
  const rows = all.filter((r) => !LEFT_OUT.has(r[2]));
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r[2], (counts.get(r[2]) ?? 0) + 1);
  const years = rows.map((r) => Number(r[1].slice(0, 4))).filter(Number.isFinite);
  return {
    total: rows.length,
    firstYear: years.length ? Math.min(...years) : null,
    byType: [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([type, count]) => ({ type, count })),
    recent: rows.slice(0, 5).map((r) => ({ title: titleCase(r[3]), type: r[2], date: r[1] })),
    copied,
  };
}

interface LiveDeclaration {
  disasterNumber: number;
  declarationDate: string;
  incidentType: string;
  declarationTitle: string;
}

export async function declarationsInCounty(
  stateFips: string,
  countyFips: string,
): Promise<Lookup<CountyDeclarations>> {
  if (!/^\d{2}$/.test(stateFips) || !/^\d{3}$/.test(countyFips)) {
    return { ok: false, reason: "No county to look up." };
  }

  const file = await declarationsFile(stateFips);
  if (file) {
    return {
      ok: true,
      data: summariseDeclarations(file.counties[countyFips] ?? [], tableNote("declarations")?.copied ?? null),
    };
  }

  const filter = `fipsStateCode eq '${stateFips}' and fipsCountyCode eq '${countyFips}'`;
  const url =
    `${BASE}/v2/DisasterDeclarationsSummaries?$filter=${encodeURIComponent(filter)}` +
    `&$select=disasterNumber,declarationDate,incidentType,declarationTitle` +
    `&$orderby=${encodeURIComponent("declarationDate desc")}&$top=1000`;
  const res = await askJson<{ DisasterDeclarationsSummaries?: LiveDeclaration[] }>(url, WHO, {
    revalidate: 7 * DAY_SECONDS,
    timeoutMs: 25_000,
    retries: 1,
  });
  if (!res.ok) return res;

  // One declaration can list a county more than once (one row per programme area).
  const unique = new Map<number, DeclarationRow>();
  for (const r of res.data.DisasterDeclarationsSummaries ?? []) {
    if (!unique.has(r.disasterNumber)) {
      unique.set(r.disasterNumber, [r.disasterNumber, r.declarationDate.slice(0, 10), r.incidentType, r.declarationTitle]);
    }
  }
  return { ok: true, data: summariseDeclarations([...unique.values()], null) };
}
