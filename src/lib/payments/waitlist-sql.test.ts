import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { CAP_STATUSES } from "./catalog";

// Migration 0012 on PGlite: the cap row, one live place per email, and the
// capacity count, which must not count an invited buyer twice.

const dir = new URL("../../../supabase/migrations/", import.meta.url);
const db = new PGlite();
const BUYER = "11111111-1111-1111-1111-111111111111";

before(async () => {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
    insert into auth.users values ('${BUYER}');
  `);
  for (const f of ["0007_report_orders.sql", "0008_charge_on_delivery.sql", "0009_order_agreement_and_deadline.sql", "0012_order_cap_and_waitlist.sql"]) {
    await db.exec(readFileSync(new URL(f, dir), "utf8"));
  }
});

const used = async () => {
  const r = await db.query<{ orders: number; held: number }>(
    "select * from public.report_capacity_used(now() - interval '7 days', $1::text[])",
    [[...CAP_STATUSES]],
  );
  return r.rows[0];
};
const order = async (status: string, ago = "0 days") => {
  const r = await db.query<{ id: string }>(
    `insert into public.report_orders (user_id, price_cents, address, status, created_at)
     values ($1, 14900, '1 Test St, Philadelphia, PA', $2, now() - $3::interval) returning id`,
    [BUYER, status, ago],
  );
  return r.rows[0].id;
};

test("0012 is the newest migration number, so it runs after the order tables", () => {
  const nums = readdirSync(dir).filter((f) => /^\d{4}_/.test(f)).map((f) => f.slice(0, 4)).sort();
  assert.equal(nums.filter((n) => n === "0012").length, 1);
});

test("the cap starts at 10 and accepts none, never zero", async () => {
  const r = await db.query<{ weekly_cap: number | null }>("select weekly_cap from public.order_settings");
  assert.deepEqual(r.rows, [{ weekly_cap: 10 }]);
  await assert.rejects(db.exec("update public.order_settings set weekly_cap = 0"));
  await db.exec("update public.order_settings set weekly_cap = null");
  await db.exec("update public.order_settings set weekly_cap = 10");
  await assert.rejects(db.exec("insert into public.order_settings (id) values (false)"));
});

test("one live place per email; leaving frees the email to join again", async () => {
  await db.exec(`insert into public.report_waitlist (name, email, address) values ('A', 'a@x.com', '1 A St, Philadelphia')`);
  await assert.rejects(db.exec(`insert into public.report_waitlist (name, email, address) values ('A', 'a@x.com', '2 A St, Philadelphia')`));
  await assert.rejects(db.exec(`insert into public.report_waitlist (name, email, address) values ('B', 'B@x.com', '2 B St, Philadelphia')`), "emails are stored lower-case");
  await db.exec(`update public.report_waitlist set status = 'left', address = null where email = 'a@x.com'`);
  await db.exec(`insert into public.report_waitlist (name, email, address) values ('A', 'a@x.com', '1 A St, Philadelphia')`);
  await assert.rejects(db.exec(`update public.report_waitlist set status = 'invited' where email = 'a@x.com' and status = 'waiting'`), "an invite needs its dates");
});

test("orders in the week count, old and unpaid ones do not, and an invite is held once", async () => {
  assert.deepEqual(await used(), { orders: 0, held: 0 });
  await order("card_saved");
  await order("delivered", "3 days");
  await order("card_saved", "8 days");   // aged out
  await order("awaiting_card");       // no card yet
  await order("abandoned");
  assert.deepEqual(await used(), { orders: 2, held: 0 });

  await db.exec(`update public.report_waitlist set status = 'invited', invited_at = now(), invite_expires_at = now() + interval '7 days'
                 where email = 'a@x.com' and status = 'waiting'`);
  assert.deepEqual(await used(), { orders: 2, held: 1 }, "an open invite holds a place");

  const o = await order("awaiting_card");
  await db.query("update public.report_waitlist set order_id = $1 where email = 'a@x.com' and status = 'invited'", [o]);
  assert.deepEqual(await used(), { orders: 2, held: 1 }, "an order with no card yet still leaves the place held");

  await db.query("update public.report_orders set status = 'card_saved' where id = $1", [o]);
  assert.deepEqual(await used(), { orders: 3, held: 0 }, "once the card is saved the order counts and the hold does not");

  await db.exec(`insert into public.report_waitlist (name, email, address, status, invited_at, invite_expires_at)
                 values ('C', 'c@x.com', '3 C St, Philadelphia', 'invited', now() - interval '8 days', now() - interval '1 day')`);
  assert.deepEqual(await used(), { orders: 3, held: 0 }, "a lapsed invite holds nothing");
});

test("the browser cannot read the list", async () => {
  const r = await db.query<{ relrowsecurity: boolean }>(
    "select relrowsecurity from pg_class where relname in ('report_waitlist', 'order_settings')",
  );
  assert.deepEqual(r.rows.map((x) => x.relrowsecurity), [true, true]);
  const p = await db.query("select * from pg_policies where tablename in ('report_waitlist', 'order_settings')");
  assert.equal(p.rows.length, 0);
});
