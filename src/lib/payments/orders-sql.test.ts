import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

// The report order's state machine, tested on the migrations themselves in
// PGlite (Postgres compiled to WebAssembly). The order is charged when the
// report is ready (Kyle, 22 November 2026): a card is saved at order, the
// deliver step charges it, and only a successful payment unlocks the report.
// What matters: every event lands once however often it is resent, nothing is
// unlocked unpaid, and nothing moves an order the wrong way.

const sql = (f: string) => readFileSync(new URL(`../../../supabase/migrations/${f}`, import.meta.url), "utf8");
const db = new PGlite();
const BUYER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

before(async () => {
  // Supabase's roles and auth schema, which the migrations refer to.
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
    insert into auth.users values ('${BUYER}'), ('${OTHER}');
  `);
  await db.exec(sql("0007_report_orders.sql"));
  // An order left from 0007, to check the mapping.
  await db.exec(`insert into public.report_orders (id, user_id, price_cents, address, status)
    values ('00000000-0000-0000-0000-000000000007', '${BUYER}', 14900, '7 Old St, Philadelphia, PA', 'awaiting_payment')`);
  await db.exec(sql("0008_charge_on_delivery.sql"));
  await db.exec(sql("0009_order_agreement_and_deadline.sql"));
});

async function newOrder(price = 14900): Promise<string> {
  const r = await db.query<{ id: string }>(
    "insert into public.report_orders (user_id, price_cents, address) values ($1, $2, '1 Test St, Philadelphia, PA') returning id",
    [BUYER, price],
  );
  return r.rows[0].id;
}
interface Opt {
  user?: string | null;
  pi?: string;
  amount?: number;
  currency?: string;
  setup?: string;
  error?: string;
  receipt?: string | null;
}
async function apply(key: string, kind: string, order: string | null, o: Opt = {}): Promise<string> {
  const r = await db.query<{ t: string }>(
    `select public.apply_payment_event(
       p_provider => 'stripe', p_event_key => $1, p_event_name => $2, p_kind => $3, p_order_id => $4, p_user_id => $5,
       p_provider_order_id => $6, p_provider_order_number => 'cs_1', p_amount_cents => $7, p_currency => $8,
       p_test_mode => true, p_receipt_url => $9, p_customer_id => 'cus_1', p_setup_id => $10, p_error => $11) as t`,
    [key, kind, kind, order, o.user === undefined ? BUYER : o.user, o.pi ?? null, o.amount ?? 15790, o.currency ?? "USD",
      o.receipt === undefined ? "https://receipt" : o.receipt, o.setup ?? `seti_${key}`, o.error ?? null],
  );
  return r.rows[0].t;
}
async function row(id: string) {
  return (await db.query<Record<string, unknown>>("select * from public.report_orders where id = $1", [id])).rows[0];
}
async function advance(id: string, to: string, path: string | null = null, note: string | null = null) {
  return (await db.query<{ t: string }>("select public.advance_report_order($1, $2, $3, $4) as t", [id, to, path, note])).rows[0].t;
}
/** An order with a saved card and its report uploaded, being charged. */
async function charging(key: string): Promise<string> {
  const id = await newOrder();
  assert.equal(await apply(`${key}-save`, "card_saved", id), "card_saved");
  assert.equal(await advance(id, "charging", `${BUYER}/${id}.pdf`), "charging");
  return id;
}

test("0007's orders are carried over to the new states", async () => {
  assert.equal((await row("00000000-0000-0000-0000-000000000007")).status, "awaiting_card");
  assert.equal((await row(await newOrder())).status, "awaiting_card");
});

test("saving a card puts the order in, with nothing charged", async () => {
  const id = await newOrder();
  assert.equal(await apply("a1", "card_saved", id, { setup: "seti_a" }), "card_saved");
  const r = await row(id);
  assert.equal(r.status, "card_saved");
  assert.equal(r.provider_customer_id, "cus_1");
  assert.equal(r.provider_setup_id, "seti_a");
  assert.equal(r.amount_paid_cents, null);
  assert.equal(r.paid_at, null);
  assert.ok(r.card_saved_at);
});

test("the same delivery sent again changes nothing", async () => {
  const id = await newOrder();
  await apply("b1", "card_saved", id, { setup: "seti_b" });
  const before = await row(id);
  assert.equal(await apply("b1", "card_saved", id, { setup: "seti_b" }), "duplicate");
  assert.equal(await apply("b2", "card_saved", id, { setup: "seti_b" }), "duplicate");
  assert.deepEqual(await row(id), before);
});

test("a second card for an order already in is flagged, not applied", async () => {
  const id = await newOrder();
  await apply("c1", "card_saved", id, { setup: "seti_c1" });
  assert.equal(await apply("c2", "card_saved", id, { setup: "seti_c2" }), "review");
  const r = await row(id);
  assert.equal(r.provider_setup_id, "seti_c1");
  assert.match(String(r.needs_review), /second card \(seti_c2\)/);
});

test("an event naming another user does not touch the order", async () => {
  const id = await newOrder();
  assert.equal(await apply("d1", "card_saved", id, { user: OTHER }), "wrong_user");
  assert.equal((await row(id)).status, "awaiting_card");
});

test("an unknown order is recorded and answered, so the provider stops resending", async () => {
  assert.equal(await apply("e1", "card_saved", "99999999-9999-9999-9999-999999999999"), "unknown_order");
  const ev = await db.query<{ outcome: string }>("select outcome from public.payment_events where event_key = 'e1'");
  assert.equal(ev.rows[0].outcome, "unknown_order");
});

test("work moves forward: card saved, in progress, charging; charging needs the report", async () => {
  const id = await newOrder();
  assert.match(await advance(id, "in_progress"), /^refused: awaiting_card/);
  assert.match(await advance(id, "charging", "x.pdf"), /^refused: awaiting_card/);
  await apply("f1", "card_saved", id);
  assert.equal(await advance(id, "in_progress"), "in_progress");
  assert.equal(await advance(id, "charging"), "needs_report_path");
  assert.equal(await advance(id, "charging", `${BUYER}/${id}.pdf`, "note"), "charging");
  const r = await row(id);
  assert.equal(r.report_path, `${BUYER}/${id}.pdf`);
  assert.equal(r.status_note, "note");
  assert.match(await advance(id, "in_progress"), /^refused: charging/);
  // A person cannot mark it delivered by hand: only a payment does.
  assert.match(await advance(id, "delivered", "x.pdf"), /^refused: charging -> delivered/);
});

test("a successful charge unlocks the report and records what was paid", async () => {
  const id = await charging("g");
  assert.equal(await apply("g1", "order_paid", id, { pi: "pi_g", amount: 15790 }), "delivered");
  const r = await row(id);
  assert.equal(r.status, "delivered");
  assert.equal(r.provider_order_id, "pi_g");
  assert.equal(r.amount_paid_cents, 15790);
  assert.equal(r.needs_review, null);
  assert.ok(r.paid_at && r.delivered_at);
});

test("the script and the webhook both record the same payment: the second is a duplicate", async () => {
  const id = await charging("h");
  assert.equal(await apply("charge:pi_h", "order_paid", id, { pi: "pi_h", receipt: null }), "delivered");
  assert.equal(await apply("evt_h", "order_paid", id, { pi: "pi_h", receipt: "https://r/h" }), "duplicate");
  const r = await row(id);
  assert.equal(r.status, "delivered");
  assert.equal(r.receipt_url, "https://r/h");
});

test("a payment before the report is ready does not unlock anything", async () => {
  const id = await newOrder();
  await apply("i1", "card_saved", id);
  assert.equal(await apply("i2", "order_paid", id, { pi: "pi_i" }), "review");
  const r = await row(id);
  assert.equal(r.status, "card_saved");
  assert.equal(r.report_path, null);
  assert.match(String(r.needs_review), /arrived while the order was card_saved/);
});

test("a failed charge waits for the buyer, and their later payment unlocks it", async () => {
  const id = await charging("j");
  assert.equal(await apply("j1", "charge_failed", id, { pi: "pi_j1", error: "Your card has insufficient funds." }), "charge_failed");
  let r = await row(id);
  assert.equal(r.status, "payment_failed");
  assert.equal(r.charge_error, "Your card has insufficient funds.");
  assert.equal(r.charge_attempts, 1);
  // Another decline on the pay page is noted, not re-announced.
  assert.equal(await apply("j2", "charge_failed", id, { pi: "pi_j2", error: "Your card was declined." }), "noted");
  assert.equal((await row(id)).charge_attempts, 1);
  // The buyer pays from their account.
  assert.equal(await apply("j3", "order_paid", id, { pi: "pi_j3" }), "delivered");
  r = await row(id);
  assert.equal(r.status, "delivered");
  assert.equal(r.charge_error, null);
});

test("a person can charge again after a failure", async () => {
  const id = await charging("k");
  await apply("k1", "charge_failed", id, { pi: "pi_k1" });
  assert.equal(await advance(id, "charging", `${BUYER}/${id}.pdf`), "charging");
  assert.equal(await apply("k2", "order_paid", id, { pi: "pi_k2" }), "delivered");
});

test("a failure for an order not being charged is ignored", async () => {
  const id = await newOrder();
  await apply("l1", "card_saved", id);
  assert.equal(await apply("l2", "charge_failed", id, { pi: "pi_l" }), "ignored");
  assert.equal((await row(id)).status, "card_saved");
});

test("paying less than the price, or in another currency, unlocks but is flagged", async () => {
  const a = await charging("m1");
  assert.equal(await apply("m1p", "order_paid", a, { pi: "pi_m1", amount: 100 }), "delivered");
  assert.equal((await row(a)).needs_review, "paid less than the price shown");
  const b = await charging("m2");
  assert.equal(await apply("m2p", "order_paid", b, { pi: "pi_m2", currency: "EUR" }), "delivered");
  assert.equal((await row(b)).needs_review, "paid in another currency");
});

test("a second, different payment for a delivered order is flagged", async () => {
  const id = await charging("n");
  await apply("n1", "order_paid", id, { pi: "pi_n1" });
  assert.equal(await apply("n2", "order_paid", id, { pi: "pi_n2" }), "review");
  const r = await row(id);
  assert.equal(r.provider_order_id, "pi_n1");
  assert.match(String(r.needs_review), /pi_n2 arrived while the order was delivered/);
});

test("one payment cannot pay for two orders", async () => {
  const a = await charging("o1");
  const b = await charging("o2");
  assert.equal(await apply("o1p", "order_paid", a, { pi: "pi_o" }), "delivered");
  assert.equal(await apply("o2p", "order_paid", b, { pi: "pi_o" }), "review");
  assert.equal((await row(b)).status, "charging");
  assert.match(String((await row(b)).needs_review), /already on another order/);
});

test("a refund lands once, only for the payment on record, and is matched without an order id", async () => {
  const id = await charging("p");
  await apply("p1", "order_paid", id, { pi: "pi_p" });
  assert.equal(await apply("p2", "order_refunded", id, { pi: "pi_other" }), "review");
  assert.equal((await row(id)).status, "delivered");
  assert.equal(await apply("p3", "order_refunded", null, { pi: "pi_p", user: null }), "refunded");
  assert.equal(await apply("p4", "order_refunded", null, { pi: "pi_p", user: null }), "duplicate");
  assert.equal((await row(id)).status, "refunded");
  // A late copy of the payment cannot reopen it.
  assert.equal(await apply("p5", "order_paid", id, { pi: "pi_p" }), "duplicate");
  assert.equal((await row(id)).status, "refunded");
  assert.equal(await apply("p6", "order_refunded", null, { pi: "pi_nobody", user: null }), "unknown_order");
});

test("a refund for an order never paid is flagged", async () => {
  const id = await newOrder();
  await apply("q1", "card_saved", id);
  assert.equal(await apply("q2", "order_refunded", id, { pi: "pi_q" }), "review");
});

test("cannot_model needs a reason, and is refused once the report is being charged", async () => {
  const id = await newOrder();
  await apply("r1", "card_saved", id);
  assert.equal(await advance(id, "cannot_model"), "needs_status_note");
  assert.equal(await advance(id, "cannot_model", null, "No lidar covers this block yet."), "cannot_model");
  const c = await charging("r2");
  assert.match(await advance(c, "cannot_model", null, "x"), /^refused: charging/);
});

test("the buyer can cancel before paying, not after", async () => {
  const id = await newOrder();
  await apply("s1", "card_saved", id);
  assert.equal(await advance(id, "cancelled", null, "Asked by email."), "cancelled");
  assert.match(await advance(id, "charging", "x.pdf"), /^refused: cancelled/);
  const f = await charging("s2");
  await apply("s3", "charge_failed", f, { pi: "pi_s" });
  assert.equal(await advance(f, "cancelled"), "cancelled");
  const d = await charging("s4");
  await apply("s5", "order_paid", d, { pi: "pi_s5" });
  assert.match(await advance(d, "cancelled"), /^refused: delivered/);
  // A payment that arrives after a cancel unlocks nothing.
  const c = await charging("s6");
  await apply("s7", "charge_failed", c, { pi: "pi_s7" });
  await advance(c, "cancelled");
  assert.equal(await apply("s8", "order_paid", c, { pi: "pi_s8" }), "review");
  assert.equal((await row(c)).status, "cancelled");
});

test("the browser roles can write nothing", async () => {
  const grants = await db.query<{ n: number }>(
    "select count(*)::int as n from information_schema.role_table_grants where grantee in ('anon','authenticated') and table_name in ('report_orders','payment_events') and privilege_type in ('INSERT','UPDATE','DELETE')",
  );
  assert.equal(grants.rows[0].n, 0);
});

test("0009: an order keeps what the buyer agreed to, when, and their inspection deadline", async () => {
  const r = await db.query<{ terms_version: string; agreed: boolean; inspection_deadline: string; deadline_acknowledged: boolean }>(
    `insert into public.report_orders (user_id, price_cents, address, terms_version, agreed_at, inspection_deadline, deadline_acknowledged)
     values ($1, 14900, '9 Test St, Philadelphia, PA', '2026-11-22-draft', now(), '2026-12-03', true)
     returning terms_version, agreed_at is not null as agreed, inspection_deadline::text, deadline_acknowledged`,
    [BUYER],
  );
  assert.deepEqual(r.rows[0], { terms_version: "2026-11-22-draft", agreed: true, inspection_deadline: "2026-12-03", deadline_acknowledged: true });
  const old = await db.query<{ deadline_acknowledged: boolean }>(
    "select deadline_acknowledged from public.report_orders where id = '00000000-0000-0000-0000-000000000007'",
  );
  assert.equal(old.rows[0].deadline_acknowledged, false);
});
