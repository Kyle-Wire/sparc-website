// Loads Climate Inspection's per-block model readings into the site's database.
//
//   node scripts/sync-block-readings.mjs <climate-inspection>/data/derived/places
//
// Reads index.json (which places have runs, and their boxes) and each place's
// screen_<place>.json, and writes them to model_places and block_readings
// (supabase/migrations/0006_listings.sql). Needs NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY in the environment.
//
// Why a database and not a file in this repository: this repository is public,
// and the readings are paid tier. They are served by the server to subscribers
// only (src/app/api/listings). Nothing here is written by hand: every value is
// copied from the files Climate Inspection built from its finished runs, with
// each file's sha256 kept beside it.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: node scripts/sync-block-readings.mjs <climate-inspection>/data/derived/places");
  process.exit(2);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.");
  process.exit(2);
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// The hash is of the file's raw bytes. Text is read as UTF-8; a statement
// holding "Â" means it was decoded as Latin-1 somewhere ("44 Â°C"),
// and the file is refused rather than shown that way.
const read = (name) => {
  const bytes = readFileSync(join(dir, name));
  const text = bytes.toString("utf8");
  if (text.includes("Â")) throw new Error(`${name}: holds a mis-decoded character (Â); refusing to load it`);
  return { json: JSON.parse(text), sha: createHash("sha256").update(bytes).digest("hex") };
};

const index = read("index.json").json;
const slug = /^-?\d{1,2}\.\d{3},-?\d{1,3}\.\d{3}$/;
let blocks = 0;

for (const p of index.places ?? []) {
  if (!p.screening_file) {
    console.log(`${p.place}: no screening file, skipped`);
    continue;
  }
  const { json, sha } = read(p.screening_file);
  const { error: placeErr } = await db.from("model_places").upsert({
    place: p.place,
    name: p.name,
    box: p.box,
    hazards: p.hazards,
    file_sha256: sha,
    updated_at: new Date().toISOString(),
  });
  if (placeErr) throw placeErr;

  const rows = Object.entries(json.blocks ?? {})
    .filter(([s]) => slug.test(s))
    .map(([s, readings]) => ({ slug: s, place: p.place, readings, updated_at: new Date().toISOString() }));
  await db.from("block_readings").delete().eq("place", p.place);
  if (rows.length) {
    const { error } = await db.from("block_readings").insert(rows);
    if (error) throw error;
  }
  blocks += rows.length;
  console.log(`${p.place}: ${rows.length} blocks (sha256 ${sha.slice(0, 12)})`);
}
console.log(`done: ${blocks} blocks`);
