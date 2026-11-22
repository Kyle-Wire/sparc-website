import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

// The report order's state machine, tested on the migration itself in PGlite
// (Postgres compiled to WebAssembly), the same way budget.test.ts tests the
// listings budget. What matters: a payment lands once however often the
// provider resends it, a refund lands once, and nothing moves an order the
// wrong way.

const MIGRATION = readFileSync(new URL("../../../supabase/migrations/0007_report_orders.sql", import.meta.url), "utf8");
const db = new PGlite();
const BUYER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

before(async () => {
  // Supabase's roles and auth schema, which the migration refers to.
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
    insert into auth.users values ('${BUYER}'), ('${OTHER}');
  `);
  await db.exec(MIGRATION);
});

async function newOrder(price = 14900): Promise<string> {
  const r = await db.query<{ id: string }>(
    "insert into public.report_orders (user_id, price_cents, address) values ($1, $2, '1 Test St, Philadelphia, PA') returning id",
    [BUYER, price],
  );
  return r.rows[0].id;
}
async function apply(
  key: string,
  kind: string,
  order: string,
  o: { user?: string | null; providerOrder?: string; amount?: number; currency?: string } = {},
): Promise<string> {
  const r = await db.query<{ t: string }>(
    "select public.apply_payment_event('lemonsqueezy', $1, $2, $3, $4, $5, $6, 'N-1', $7, $8, true, 'https://receipt') as t",
    [key, kind === "order_paid" ? "order_created" : "order_refunded", kind, order, o.user === undefined ? BUYER : o.user, o.providerOrder ?? "LS-1", o.amount ?? 14900, o.currency ?? "USD"],
  );
  return r.rows[0].t;
}
async function row(id: string) {
  return (await db.query<Record<string, unknown>>("select * from public.report_orders where id = $1", [id])).rows[0];
}
async function advance(id: string, to: string, path: string | null = null, note: string | null = null) {
  return (await db.query<{ t: string }>("select public.advance_report_order($1, $2, $3, $4) as t", [id, to, path, note])).rows[0].t;
}

test("a payment moves the order to paid and records what was paid", async () => {
  const id = await newOrder();
  assert.equal(await apply("a1", "order_paid", id), "paid");
  const r = await row(id);
  assert.equal(r.status, "paid");
  assert.equal(r.amount_paid_cents, 14900);
  assert.equal(r.provider_order_id, "LS-1");
  assert.equal(r.test_mode, true);
  assert.equal(r.needs_review, null);
});

test("the same delivery sent again changes nothing", async () => {
  const id = await newOrder();
  assert.equal(await apply("b1", "order_paid", id, { providerOrder: "LS-b" }), "paid");
  const before = await row(id);
  assert.equal(await apply("b1", "order_paid", id, { providerOrder: "LS-b" }), "duplicate");
  assert.deepEqual(await row(id), before);
});

test("a second, different payment for a paid order is flagged, not applied", async () => {
  const id = await newOrder();
  await apply("c1", "order_paid", id, { providerOrder: "LS-10" });
  assert.equal(await apply("c2", "order_paid", id, { providerOrder: "LS-11" }), "review");
  const r = await row(id);
  assert.equal(r.provider_order_id, "LS-10");
  assert.match(String(r.needs_review), /second payment LS-11/);
});

test("an event naming another user does not touch the order", async () => {
  const id = await newOrder();
  assert.equal(await apply("d1", "order_paid", id, { user: OTHER }), "wrong_user");
  assert.equal((await row(id)).status, "awaiting_payment");
});

test("an unknown order is recorded and answered, so the provider stops resending", async () => {
  assert.equal(await apply("e1", "order_paid", "99999999-9999-9999-9999-999999999999"), "unknown_order");
  const ev = await db.query<{ outcome: string }>("select outcome from public.payment_events where event_key = 'e1'");
  assert.equal(ev.rows[0].outcome, "unknown_order");
});

test("paying more than the price shown, or in another currency, is paid but flagged", async () => {
  const a = await newOrder();
  assert.equal(await apply("f1", "order_paid", a, { amount: 99900, providerOrder: "LS-f1" }), "paid");
  assert.equal((await row(a)).needs_review, "paid more than the price shown");
  const b = await newOrder();
  assert.equal(await apply("f2", "order_paid", b, { currency: "EUR", providerOrder: "LS-f2" }), "paid");
  assert.equal((await row(b)).needs_review, "paid in another currency");
});

test("a discount (paying less) is not flagged", async () => {
  const id = await newOrder();
  await apply("g1", "order_paid", id, { amount: 7450, providerOrder: "LS-g1" });
  assert.equal((await row(id)).needs_review, null);
});

test("a refund lands once, and only for the payment on record", async () => {
  const id = await newOrder();
  await apply("h1", "order_paid", id, { providerOrder: "LS-h" });
  assert.equal(await apply("h2", "order_refunded", id, { providerOrder: "LS-other" }), "review");
  assert.equal((await row(id)).status, "paid");
  assert.equal(await apply("h3", "order_refunded", id, { providerOrder: "LS-h" }), "refunded");
  assert.equal(await apply("h4", "order_refunded", id, { providerOrder: "LS-h" }), "duplicate");
  assert.equal((await row(id)).status, "refunded");
});

test("a late payment event after a refund cannot reopen the order", async () => {
  const id = await newOrder();
  await apply("i1", "order_paid", id, { providerOrder: "LS-i" });
  await apply("i2", "order_refunded", id, { providerOrder: "LS-i" });
  assert.equal(await apply("i3", "order_paid", id, { providerOrder: "LS-i" }), "duplicate");
  assert.equal((await row(id)).status, "refunded");
});

test("fulfilment moves forward only: paid, in progress, delivered", async () => {
  const id = await newOrder();
  assert.match(await advance(id, "in_progress"), /^refused: awaiting_payment/);
  await apply("j1", "order_paid", id, { providerOrder: "LS-j" });
  assert.equal(await advance(id, "delivered"), "needs_report_path");
  assert.equal(await advance(id, "in_progress"), "in_progress");
  assert.equal(await advance(id, "delivered", `${BUYER}/${id}.pdf`), "delivered");
  const r = await row(id);
  assert.equal(r.status, "delivered");
  assert.equal(r.report_path, `${BUYER}/${id}.pdf`);
  assert.match(await advance(id, "cannot_model", null, "x"), /^refused: delivered/);
});

test("cannot_model needs a reason the buyer will read", async () => {
  const id = await newOrder();
  await apply("k1", "order_paid", id, { providerOrder: "LS-k" });
  assert.equal(await advance(id, "cannot_model"), "needs_status_note");
  assert.equal(await advance(id, "cannot_model", null, "No lidar covers this block yet."), "cannot_model");
});

test("one provider order cannot pay for two of ours", async () => {
  const a = await newOrder();
  const b = await newOrder();
  assert.equal(await apply("l1", "order_paid", a, { providerOrder: "LS-l" }), "paid");
  assert.equal(await apply("l2", "order_paid", b, { providerOrder: "LS-l" }), "review");
  assert.equal((await row(b)).status, "awaiting_payment");
  assert.match(String((await row(b)).needs_review), /already on another order/);
});

test("the browser roles can write nothing", async () => {
  const grants = await db.query<{ n: number }>(
    "select count(*)::int as n from information_schema.role_table_grants where grantee in ('anon','authenticated') and table_name in ('report_orders','payment_events') and privilege_type in ('INSERT','UPDATE','DELETE')",
  );
  assert.equal(grants.rows[0].n, 0);
});
