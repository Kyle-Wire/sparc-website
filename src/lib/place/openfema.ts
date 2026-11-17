// OpenFEMA: flood insurance claims in the census tract, and federal disaster
// declarations for the county. https://www.fema.gov/about/openfema/data-sets
//   NfipClaims v3                     one row per claim, located to a census block group
//   DisasterDeclarationsSummaries v2  one row per declaration per county
//
// What a claim count is and is not. Only homes with a National Flood Insurance
// Program policy can make a claim, so a low count does not mean no flooding,
// and the card says so in its own words. Counts only: no dollar amounts are
// read or shown, because the product makes no statement about loss.

import { askJson, DAY_SECONDS, type Lookup } from "./lookup";

const BASE = "https://www.fema.gov/api/open";
const WHO = "FEMA's open data service";

/** OpenFEMA returns at most this many rows per request. */
const PAGE = 10_000;

export interface TractClaims {
  total: number;
  /** True when the tract has more claims than one request returns. */
  atLeast: boolean;
  firstYear: number | null;
  lastYear: number | null;
  yearsWithClaims: number;
  /** The three years with the most claims, most first. */
  busiestYears: { year: number; claims: number }[];
}

export async function claimsInTract(tractGeoid: string): Promise<Lookup<TractClaims>> {
  if (!/^\d{11}$/.test(tractGeoid)) return { ok: false, reason: "No census tract to look up." };
  // censusGeoid is a block group (twelve digits); the tract is its first eleven.
  const filter = `startswith(censusGeoid,'${tractGeoid}')`;
  const url =
    `${BASE}/v3/NfipClaims?$filter=${encodeURIComponent(filter)}` +
    `&$select=yearOfLoss&$top=${PAGE}`;
  const res = await askJson<{ NfipClaims?: { yearOfLoss: number | null }[] }>(url, WHO, {
    revalidate: 7 * DAY_SECONDS,
    timeoutMs: 25_000,
  });
  if (!res.ok) return res;

  const rows = res.data.NfipClaims ?? [];
  const byYear = new Map<number, number>();
  for (const r of rows) {
    if (typeof r.yearOfLoss !== "number") continue;
    byYear.set(r.yearOfLoss, (byYear.get(r.yearOfLoss) ?? 0) + 1);
  }
  const years = [...byYear.keys()].sort((a, b) => a - b);
  const busiestYears = [...byYear.entries()]
    .sort((a, b) => b[1] - a[1] || b[0] - a[0])
    .slice(0, 3)
    .map(([year, claims]) => ({ year, claims }));

  return {
    ok: true,
    data: {
      total: rows.length,
      atLeast: rows.length >= PAGE,
      firstYear: years[0] ?? null,
      lastYear: years[years.length - 1] ?? null,
      yearsWithClaims: years.length,
      busiestYears,
    },
  };
}

interface DeclarationRow {
  disasterNumber: number;
  declarationDate: string;
  incidentType: string;
  declarationTitle: string;
}

export interface CountyDeclarations {
  total: number;
  firstYear: number | null;
  /** Declarations by FEMA's incident type, most first. */
  byType: { type: string; count: number }[];
  /** The five most recent, newest first. */
  recent: { title: string; type: string; date: string }[];
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

export async function declarationsInCounty(
  stateFips: string,
  countyFips: string,
): Promise<Lookup<CountyDeclarations>> {
  if (!/^\d{2}$/.test(stateFips) || !/^\d{3}$/.test(countyFips)) {
    return { ok: false, reason: "No county to look up." };
  }
  const filter = `fipsStateCode eq '${stateFips}' and fipsCountyCode eq '${countyFips}'`;
  const url =
    `${BASE}/v2/DisasterDeclarationsSummaries?$filter=${encodeURIComponent(filter)}` +
    `&$select=disasterNumber,declarationDate,incidentType,declarationTitle` +
    `&$orderby=${encodeURIComponent("declarationDate desc")}&$top=1000`;
  const res = await askJson<{ DisasterDeclarationsSummaries?: DeclarationRow[] }>(url, WHO, {
    revalidate: 7 * DAY_SECONDS,
    timeoutMs: 25_000,
  });
  if (!res.ok) return res;

  // One declaration can list a county more than once (one row per programme area).
  const unique = new Map<number, DeclarationRow>();
  for (const r of res.data.DisasterDeclarationsSummaries ?? []) {
    if (LEFT_OUT.has(r.incidentType)) continue;
    if (!unique.has(r.disasterNumber)) unique.set(r.disasterNumber, r);
  }
  const rows = [...unique.values()];
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.incidentType, (counts.get(r.incidentType) ?? 0) + 1);
  const years = rows.map((r) => Number(r.declarationDate.slice(0, 4))).filter(Number.isFinite);

  return {
    ok: true,
    data: {
      total: rows.length,
      firstYear: years.length ? Math.min(...years) : null,
      byType: [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([type, count]) => ({ type, count })),
      recent: rows.slice(0, 5).map((r) => ({
        title: titleCase(r.declarationTitle),
        type: r.incidentType,
        date: r.declarationDate.slice(0, 10),
      })),
    },
  };
}
