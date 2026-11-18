import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { mayCallFeed } from "./feed";

// The feed budget, tested on the migration itself, run in PGlite (Postgres
// compiled to WebAssembly). Kyle: "the API call can never exceed the limit of
// 50". RentCast's free plan is 50 requests a month, with no hard cap and a
// charge per request over; the site stops at 45 in any 31 days.

const MIGRATION = readFileSync(new URL("../../../supabase/migrations/0006_listings.sql", import.meta.url), "utf8");
const db = new PGlite();

before(async () => {
  // Supabase's roles, which the migration revokes from.
  await db.exec("create role anon; create role authenticated;");
  await db.exec(MIGRATION);
});

async function reset() {
  await db.exec("truncate public.feed_request_log; truncate public.listing_areas cascade;");
}
/** Requests already made, `daysAgo` before now, each for its own ZIP code. */
async function history(n: number, daysAgo: number, prefix = "h") {
  for (let i = 0; i < n; i++) {
    await db.query("insert into public.feed_request_log (source, zip, at) values ('RentCast', $1, now() - make_interval(secs => $2))", [
      `${prefix}${i}`,
      daysAgo * 86400,
    ]);
  }
}
async function take(zip: string, source = "RentCast"): Promise<string> {
  const r = await db.query<{ t: string }>("select public.take_feed_request($1, $2) as t", [source, zip]);
  return r.rows[0].t;
}
async function used(): Promise<number> {
  return (await db.query<{ n: number }>("select public.feed_requests_used('RentCast') as n")).rows[0].n;
}

test("the 46th request in 31 days is refused", async () => {
  await reset();
  await history(44, 2);
  assert.equal(await take("00045"), "ok");
  assert.equal(await used(), 45);
  assert.equal(await take("00046"), "window_spent");
  assert.equal(await used(), 45);
});

test("a calendar-month straddle is refused: 45 at the end of one month and more at the start of the next", async () => {
  await reset();
  await history(45, 3); // "30 November", three days ago
  assert.equal(await take("12001"), "window_spent"); // "1 December"
});

test("requests older than 31 days no longer count", async () => {
  await reset();
  await history(45, 32);
  assert.equal(await take("12002"), "ok");
});

test("the ceiling is fixed in the database: the function takes no cap from its caller", async () => {
  const args = await db.query<{ a: string }>(
    "select pg_get_function_identity_arguments('public.take_feed_request'::regproc) as a",
  );
  assert.equal(args.rows[0].a, "p_source text, p_zip text");
  await assert.rejects(db.query("select public.take_feed_request('RentCast', '00001', 1000)"));
});

test("no more than ten in a day", async () => {
  await reset();
  for (let i = 0; i < 10; i++) assert.equal(await take(`d${i}`), "ok");
  assert.equal(await take("d10"), "day_spent");
  assert.equal(await used(), 10);
});

test("a ZIP code tried in the last day is not tried again", async () => {
  await reset();
  assert.equal(await take("19147"), "ok"); // the call fails: no fetched_at is written
  assert.equal(await take("19147"), "zip_recent");
  assert.equal(await used(), 1);
  await db.exec("update public.listing_areas set last_attempt_at = now() - interval '25 hours' where zip = '19147'");
  assert.equal(await take("19147"), "ok");
});

test("two visitors at once at 44 used: only one gets the last request", async () => {
  await reset();
  await history(44, 1);
  // PGlite has one connection, so the two calls run one after the other. On
  // Supabase the advisory lock in the function gives the same order.
  const [a, b] = await Promise.all([take("c1"), take("c2")]);
  assert.deepEqual([a, b].sort(), ["ok", "window_spent"]);
  assert.equal(await used(), 45);
});

test("only the production site may call the feed, unless told otherwise", () => {
  assert.equal(mayCallFeed({ VERCEL_ENV: "production" }), true);
  assert.equal(mayCallFeed({ VERCEL_ENV: "preview" }), false);
  assert.equal(mayCallFeed({}), false);
  assert.equal(mayCallFeed({ RENTCAST_ALLOW_NONPROD: "1" }), true);
  assert.equal(mayCallFeed({ RENTCAST_ALLOW_NONPROD: "true" }), false);
});
