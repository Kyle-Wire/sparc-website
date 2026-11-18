/**
 * Builds the site's own copy of three FEMA tables, one file per state:
 *
 *   src/data/fema/claims/<ss>.json        flood insurance claims by census tract and year
 *   src/data/fema/declarations/<ss>.json  federal disaster declarations by county
 *   src/data/fema/risk/<ss>.json          National Risk Index ratings by census tract
 *   src/data/fema/manifest.json           what was read, from where, and when
 *
 * Run: npm run data:fema        (about five minutes; three sources, about fifty requests)
 *      npm run data:fema -- claims|declarations|risk     (one table only)
 *
 * Why the site keeps a copy. A place page used to ask FEMA's servers for these
 * three tables on every first visit to a place. In testing on 17 Nov 2026
 * FEMA's open data service began answering 503 to one machine after a few
 * dozen lookups. The tables are small, change at most monthly, and FEMA
 * publishes them whole, so the site reads its own copy and asks FEMA only for
 * a state the copy does not hold (src/lib/place/openfema.ts, nri.ts).
 *
 * What the copy is. Counts and labels exactly as FEMA publishes them. Nothing
 * is modelled, smoothed or re-classified here:
 *   - claims are counted by the census tract FEMA located them to (the first
 *     eleven digits of censusGeoid) and by year of loss. Claims FEMA has not
 *     located to a census area cannot be counted for any tract; the manifest
 *     records how many there are, and the claims card says so.
 *   - declarations keep FEMA's number, date, incident type and title, once per
 *     county per declaration.
 *   - risk ratings keep FEMA's rating words, coded one character each
 *     (RATING_CODES below).
 * No dollar amounts are read from any of the three sources.
 *
 * Sources (each opened and queried on 17 Nov 2026):
 *   https://www.fema.gov/api/open/v3/NfipClaims
 *   https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries
 *   https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "src", "data", "fema");
const MANIFEST = join(OUT, "manifest.json");
const UA = "sparclabs-site/1 (monthly table refresh)";
const only = process.argv[2];

const OPENFEMA = "https://www.fema.gov/api/open";
const NRI =
  "https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0";

/** The field prefixes of the eighteen hazards, in the order the files store them.
 *  src/lib/place/nri.ts reads the order from each file, not from here. */
const NRI_FIELDS = [
  "RISK_RATNG",
  ...["AVLN", "CFLD", "CWAV", "DRGT", "ERQK", "HAIL", "HWAV", "HRCN", "ISTM", "LNDS", "LTNG", "IFLD", "SWND", "TRND", "TSUN", "VLCN", "WFIR", "WNTW"].map(
    (k) => `${k}_RISKR`,
  ),
];

/** FEMA's rating words, one character each. Anything unexpected is kept as "?"
 *  and counted, so a new word from FEMA shows up in the build output. */
const RATING_CODES = {
  "Very Low": "1",
  "Relatively Low": "2",
  "Relatively Moderate": "3",
  "Relatively High": "4",
  "Very High": "5",
  "No Rating": "n",
  "Not Applicable": "a",
  "Insufficient Data": "i",
};

function fail(msg) {
  console.error(`build-fema-tables  FAILED  ·  ${msg}`);
  process.exit(1);
}

async function ask(url, tries = 4) {
  let last = "";
  for (let i = 0; i < tries; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 5000 * i));
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) return res;
      last = `answered ${res.status}`;
    } catch (err) {
      last = String(err?.cause?.code ?? err?.message ?? err);
    }
  }
  fail(`${url.slice(0, 120)} ${last}`);
}

/** Runs a whole download-and-count pass again if the connection drops part
 *  way through. FEMA's service cut a long download short during the first
 *  run of this script (17 Nov 2026), so one dropped stream is not a failure;
 *  several in a row is. Each attempt starts from nothing, so a half-read
 *  table can never be written. */
async function wholePass(name, pass, tries = 4, fatal = true) {
  let last = "";
  for (let i = 0; i < tries; i++) {
    if (i > 0) {
      console.warn(`build-fema-tables  note  ·  ${name}: the download broke off (${last}); starting it again`);
      await new Promise((r) => setTimeout(r, 15_000 * i));
    }
    try {
      return await pass();
    } catch (err) {
      last = String(err?.cause?.code ?? err?.message ?? err);
    }
  }
  if (fatal) fail(`${name}: the download broke off ${tries} times (${last})`);
  throw new Error(`the download broke off ${tries} times (${last})`);
}

/** Calls onLine for every line of a streamed text response. */
async function eachLine(res, onLine) {
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let rest = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const parts = (rest + value).split("\n");
    rest = parts.pop() ?? "";
    for (const line of parts) onLine(line);
  }
  if (rest) onLine(rest);
}

function writeByState(folder, byState, wrap) {
  const dir = join(OUT, folder);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const states = [...byState.keys()].sort();
  for (const ss of states) writeFileSync(join(dir, `${ss}.json`), JSON.stringify(wrap(byState.get(ss))));
  return states;
}

/** FEMA's own record of when it last refreshed each dataset. */
async function datasetInfo() {
  const res = await ask(`${OPENFEMA}/v1/OpenFemaDataSets?$top=500`);
  const rows = (await res.json()).OpenFemaDataSets ?? [];
  const info = {};
  for (const r of rows) {
    if (r.depDate) continue;
    if (r.name === "NfipClaims" || r.name === "DisasterDeclarationsSummaries") {
      info[r.name] = { version: r.version, records: r.recordCount, lastRefresh: r.lastDataSetRefresh };
    }
  }
  return info;
}

/* ---------------- claims ---------------- */

/** One pass over a claims download (the whole table, or one year of it).
 *  Returns tract -> year -> count, the rows seen, and the rows FEMA has not
 *  located to a census area. */
async function readClaims(filter) {
  const url =
    `${OPENFEMA}/v3/NfipClaims?` +
    (filter ? `$filter=${encodeURIComponent(filter)}&` : "") +
    `$select=censusGeoid,yearOfLoss&$format=csv&$allrecords=true`;
  const res = await ask(url);
  const tracts = new Map();
  let rows = 0;
  let unlocated = 0;
  let first = true;
  await eachLine(res, (line) => {
    if (first) {
      first = false;
      if (!/censusGeoid/.test(line)) throw new Error("the claims file does not start with the expected header");
      return;
    }
    const [geoid, yearText] = line.trim().replace(/"/g, "").split(",");
    if (!yearText) return;
    rows++;
    const year = Number(yearText);
    if (!/^\d{12}$/.test(geoid ?? "") || !Number.isInteger(year)) {
      unlocated++;
      return;
    }
    const tract = geoid.slice(0, 11);
    let years = tracts.get(tract);
    if (!years) tracts.set(tract, (years = new Map()));
    years.set(year, (years.get(year) ?? 0) + 1);
  });
  return { rows, unlocated, tracts };
}

const FIRST_CLAIM_YEAR = 1970;

/** The whole table in one download is the quick way: about ten minutes at the
 *  speed FEMA's service sends it. A stream that long can break off (it did on
 *  the first run of this script, 17 Nov 2026), so it is tried twice and then
 *  the table is read one year of loss at a time instead: slower, about an
 *  hour, but a year that breaks off is simply asked for again. */
async function buildClaims(info) {
  const expected = info.NfipClaims?.records;
  const complete = (rows) => rows >= 1_000_000 && (!expected || rows >= expected * 0.995);

  let got = null;
  try {
    got = await wholePass(
      "claims",
      async () => {
        const all = await readClaims(null);
        if (!complete(all.rows)) throw new Error(`only ${all.rows} of about ${expected ?? "2.7 million"} claims arrived`);
        return all;
      },
      2,
      false,
    );
  } catch (err) {
    console.warn(`build-fema-tables  note  ·  claims: ${err.message}. Reading one year at a time instead.`);
  }

  if (!got) {
    got = { rows: 0, unlocated: 0, tracts: new Map() };
    const thisYear = new Date().getUTCFullYear();
    for (let year = FIRST_CLAIM_YEAR; year <= thisYear; year++) {
      const part = await wholePass(`claims ${year}`, () => readClaims(`yearOfLoss eq ${year}`));
      got.rows += part.rows;
      got.unlocated += part.unlocated;
      for (const [tract, years] of part.tracts) {
        let mine = got.tracts.get(tract);
        if (!mine) got.tracts.set(tract, (mine = new Map()));
        for (const [y, n] of years) mine.set(y, (mine.get(y) ?? 0) + n);
      }
      if (part.rows) console.log(`build-fema-tables  ·  claims ${year}: ${part.rows}`);
    }
    // FEMA's own count is the check that no year was missed, including any before FIRST_CLAIM_YEAR.
    if (!complete(got.rows)) fail(`claims: ${got.rows} read, but FEMA lists ${expected ?? "about 2.7 million"}`);
  }

  const rows = got.rows;
  const unlocated = got.unlocated;
  /** state -> tract -> year -> count */
  const byState = new Map();
  for (const [tract, years] of got.tracts) {
    const ss = tract.slice(0, 2);
    let tracts = byState.get(ss);
    if (!tracts) byState.set(ss, (tracts = new Map()));
    tracts.set(tract, years);
  }

  let tractCount = 0;
  const states = writeByState("claims", byState, (tracts) => {
    const out = {};
    for (const [tract, years] of [...tracts.entries()].sort()) {
      tractCount++;
      // [year, count, year, count, ...], oldest first
      out[tract] = [...years.entries()].sort((a, b) => a[0] - b[0]).flat();
    }
    return { tracts: out };
  });
  return {
    source: `${OPENFEMA}/v3/NfipClaims`,
    femaLastRefresh: info.NfipClaims?.lastRefresh ?? null,
    claimsRead: rows,
    claimsNotLocated: unlocated,
    tractsWithClaims: tractCount,
    states: states.length,
  };
}

/* ---------------- declarations ---------------- */

async function buildDeclarations(info) {
  return wholePass("declarations", () => readDeclarations(info));
}

async function readDeclarations(info) {
  const url =
    `${OPENFEMA}/v2/DisasterDeclarationsSummaries?$select=disasterNumber,declarationDate,incidentType,` +
    `declarationTitle,fipsStateCode,fipsCountyCode&$format=jsonl&$allrecords=true`;
  const res = await ask(url);
  /** state -> county -> disasterNumber -> [number, yyyy-mm-dd, type, title] */
  const byState = new Map();
  let rows = 0;
  await eachLine(res, (line) => {
    const text = line.trim();
    if (!text) return;
    let r;
    try {
      r = JSON.parse(text);
    } catch {
      return;
    }
    rows++;
    const ss = r.fipsStateCode;
    const county = r.fipsCountyCode;
    if (!/^\d{2}$/.test(ss ?? "") || !/^\d{3}$/.test(county ?? "")) return;
    let counties = byState.get(ss);
    if (!counties) byState.set(ss, (counties = new Map()));
    let list = counties.get(county);
    if (!list) counties.set(county, (list = new Map()));
    if (!list.has(r.disasterNumber)) {
      list.set(r.disasterNumber, [
        r.disasterNumber,
        String(r.declarationDate).slice(0, 10),
        r.incidentType,
        r.declarationTitle,
      ]);
    }
  });
  const expected = info.DisasterDeclarationsSummaries?.records;
  if (rows < 50_000 || (expected && rows < expected * 0.98)) {
    throw new Error(`only ${rows} of about ${expected ?? "70,000"} declaration rows arrived`);
  }

  let countyCount = 0;
  const states = writeByState("declarations", byState, (counties) => {
    const out = {};
    for (const [county, list] of [...counties.entries()].sort()) {
      countyCount++;
      // newest first, as the live lookup asks for them
      out[county] = [...list.values()].sort((a, b) => (a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : b[0] - a[0]));
    }
    return { counties: out };
  });
  return {
    source: `${OPENFEMA}/v2/DisasterDeclarationsSummaries`,
    femaLastRefresh: info.DisasterDeclarationsSummaries?.lastRefresh ?? null,
    rowsRead: rows,
    counties: countyCount,
    states: states.length,
  };
}

/* ---------------- risk index ---------------- */

async function buildRisk() {
  const fields = ["TRACTFIPS", "NRI_VER", ...NRI_FIELDS].join(",");
  const page = 2000;
  /** state -> tract -> coded ratings */
  const byState = new Map();
  let version = null;
  let total = 0;
  const unknown = new Map();
  for (let offset = 0; ; offset += page) {
    const q = new URLSearchParams({
      where: "1=1",
      outFields: fields,
      returnGeometry: "false",
      orderByFields: "TRACTFIPS",
      resultOffset: String(offset),
      resultRecordCount: String(page),
      f: "json",
    });
    const body = await (await ask(`${NRI}/query?${q.toString()}`)).json();
    if (body.error) fail(`the risk index service answered with an error at offset ${offset}`);
    const feats = body.features ?? [];
    for (const f of feats) {
      const a = f.attributes;
      const tract = a.TRACTFIPS;
      if (!/^\d{11}$/.test(tract ?? "")) continue;
      version ??= a.NRI_VER ?? null;
      const code = NRI_FIELDS.map((k) => {
        const word = typeof a[k] === "string" ? a[k].trim() : "No Rating";
        const c = RATING_CODES[word];
        if (!c) unknown.set(word, (unknown.get(word) ?? 0) + 1);
        return c ?? "?";
      }).join("");
      const ss = tract.slice(0, 2);
      let tracts = byState.get(ss);
      if (!tracts) byState.set(ss, (tracts = new Map()));
      tracts.set(tract, code);
      total++;
    }
    if (feats.length < page && !body.exceededTransferLimit) break;
  }
  if (total < 50_000) fail(`only ${total} tracts were read from the risk index`);
  if (unknown.size) console.warn("build-fema-tables  note  ·  rating words not in the code table:", [...unknown.entries()]);

  const states = writeByState("risk", byState, (tracts) => ({
    version,
    fields: NRI_FIELDS,
    codes: RATING_CODES,
    tracts: Object.fromEntries([...tracts.entries()].sort()),
  }));
  return { source: NRI, femaVersion: version, tracts: total, states: states.length, unknownRatings: unknown.size };
}

/* ---------------- run ---------------- */

mkdirSync(OUT, { recursive: true });
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
const info = await datasetInfo();
const today = new Date().toISOString().slice(0, 10);

const jobs = { claims: () => buildClaims(info), declarations: () => buildDeclarations(info), risk: buildRisk };
if (only && !jobs[only]) fail(`unknown table "${only}". Use claims, declarations or risk.`);

for (const [name, job] of Object.entries(jobs)) {
  if (only && only !== name) continue;
  const result = await job();
  manifest[name] = { copied: today, ...result };
  console.log(`build-fema-tables  ok  ·  ${name}`, JSON.stringify(result));
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
