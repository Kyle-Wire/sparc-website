import { test } from "node:test";
import assert from "node:assert/strict";
import { checkOrder } from "./order-input";
import { formatPrice, checkoutEnabled, REPORT } from "./catalog";

function form(o: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
}

test("a full order passes, with the place rounded to a block", () => {
  const r = checkOrder(form({ address: "  1200  Example St,\nPhiladelphia, PA 19147 ", agree: "yes", place: "39.940,-75.160", note: "Basement?" }));
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.address, "1200 Example St, Philadelphia, PA 19147");
    assert.equal(r.value.placeSlug, "39.940,-75.160");
    assert.equal(r.value.note, "Basement?");
  }
});

test("an address needs a house number and a sensible length", () => {
  assert.deepEqual(checkOrder(form({ address: "Main Street", agree: "yes" })), { ok: false, error: "address" });
  assert.deepEqual(checkOrder(form({ address: "1", agree: "yes" })), { ok: false, error: "address" });
  assert.deepEqual(checkOrder(form({ address: "1 " + "x".repeat(400), agree: "yes" })), { ok: false, error: "address" });
});

test("the buyer must tick that they read what the report is not", () => {
  assert.deepEqual(checkOrder(form({ address: "1 Main St, Town, ST" })), { ok: false, error: "agree" });
});

test("an inspection deadline before the promise needs the buyer's yes", () => {
  const base = { address: "1 Main St, Town, ST", agree: "yes" };
  const today = "2026-11-23"; // promise: Tue 8 Dec 2026
  assert.deepEqual(checkOrder(form({ ...base, deadline: "2026-12-03" }), today), { ok: false, error: "deadline" });
  const r = checkOrder(form({ ...base, deadline: "2026-12-03", deadline_ack: "yes" }), today);
  assert.ok(r.ok && r.value.inspectionDeadline === "2026-12-03" && r.value.deadlineAcknowledged === true);
  const late = checkOrder(form({ ...base, deadline: "2026-12-20", deadline_ack: "yes" }), today);
  assert.ok(late.ok && late.value.inspectionDeadline === "2026-12-20" && late.value.deadlineAcknowledged === false);
  const none = checkOrder(form(base), today);
  assert.ok(none.ok && none.value.inspectionDeadline === null && none.value.deadlineAcknowledged === false);
  assert.deepEqual(checkOrder(form({ ...base, deadline: "2026-11-01" }), today), { ok: false, error: "deadline_past" });
  assert.deepEqual(checkOrder(form({ ...base, deadline: "soon" }), today), { ok: false, error: "deadline_invalid" });
});

test("the weekly cap defaults to 10, and \"none\" turns it off", async () => {
  const { weeklyCap, REPORT_TERMS_VERSION, AGREE_STATEMENT } = await import("./catalog");
  assert.equal(weeklyCap({}), 10);
  assert.equal(weeklyCap({ ORDERS_WEEKLY_CAP: "0" }), 10);
  assert.equal(weeklyCap({ ORDERS_WEEKLY_CAP: "2.5" }), 10);
  assert.equal(weeklyCap({ ORDERS_WEEKLY_CAP: "none" }), null);
  assert.equal(weeklyCap({ ORDERS_WEEKLY_CAP: "off" }), null);
  assert.equal(weeklyCap({ ORDERS_WEEKLY_CAP: "3" }), 3);
  assert.match(REPORT_TERMS_VERSION, /^\d{4}-\d{2}-\d{2}/);
  assert.match(AGREE_STATEMENT, /screening report/);
});

test("a place outside the US or garbage is dropped, not trusted", () => {
  const r = checkOrder(form({ address: "1 Main St, Town, ST", agree: "yes", place: "51.5,-0.12" }));
  assert.ok(r.ok && r.value.placeSlug === null);
});

test("prices print as a buyer reads them", () => {
  assert.equal(formatPrice(14900), "$149");
  assert.equal(formatPrice(14950), "$149.50");
  assert.ok(REPORT.priceCents > 0);
});

test("checkout is off unless switched on exactly", () => {
  assert.equal(checkoutEnabled({}), false);
  assert.equal(checkoutEnabled({ CHECKOUT_ENABLED: "1" }), false);
  assert.equal(checkoutEnabled({ CHECKOUT_ENABLED: "true" }), true);
});

test("soft launch: checkout on means invitation only until ORDERS_OPEN", async () => {
  const { salesMode, mayOrder } = await import("./catalog");
  const invite = { CHECKOUT_ENABLED: "true", ORDER_INVITE_EMAILS: "A@Example.com, b@example.com;c@x.org" };
  assert.equal(salesMode({}), "off");
  assert.equal(salesMode({ ORDERS_OPEN: "true" }), "off");
  assert.equal(salesMode(invite), "invite");
  assert.equal(salesMode({ ...invite, ORDERS_OPEN: "true" }), "open");
  assert.equal(mayOrder("a@example.com", invite), true);
  assert.equal(mayOrder(" C@X.ORG ", invite), true);
  assert.equal(mayOrder("d@example.com", invite), false);
  assert.equal(mayOrder(null, invite), false);
  assert.equal(mayOrder("a@example.com", {}), false);
  assert.equal(mayOrder("anyone@example.com", { CHECKOUT_ENABLED: "true" }), false);
  assert.equal(mayOrder("anyone@example.com", { CHECKOUT_ENABLED: "true", ORDERS_OPEN: "true" }), true);
});

test("the buyer's answers about the house are optional, checked and kept as null when blank (D53)", () => {
  const base = { address: "1 Main St, Town, ST", agree: "yes" };
  const today = "2026-11-23";
  const none = checkOrder(form(base), today);
  assert.ok(none.ok);
  if (none.ok) assert.deepEqual(none.value.houseFacts, { basement: null, central_air: null, year_built: null, storeys: null, first_floor_ft: null, basement_finished: null });
  const all = checkOrder(
    form({ ...base, basement: "partial", central_air: "no", year_built: "1925", storeys: "3", first_floor_ft: "2", basement_finished: "finished" }),
    today,
  );
  assert.ok(all.ok);
  if (all.ok)
    assert.deepEqual(all.value.houseFacts, {
      basement: "partial",
      central_air: false,
      year_built: 1925,
      storeys: 3,
      first_floor_ft: 2,
      basement_finished: "finished",
    });
  const level = checkOrder(form({ ...base, first_floor_ft: "0" }), today); // level with the ground is an answer, not a blank
  assert.ok(level.ok);
  if (level.ok) assert.equal(level.value.houseFacts.first_floor_ft, 0);
  const noBasement = checkOrder(form({ ...base, basement: "none", basement_finished: "finished" }), today);
  assert.ok(noBasement.ok);
  if (noBasement.ok) assert.equal(noBasement.value.houseFacts.basement_finished, null);
  const bads: Record<string, string>[] = [
    { basement: "attic" },
    { central_air: "maybe" },
    { year_built: "1650" },
    { year_built: "2028" },
    { year_built: "19x5" },
    { storeys: "7" },
    { storeys: "0" },
    { first_floor_ft: "9" },
    { first_floor_ft: "-1" },
    { first_floor_ft: "2.5" },
    { basement_finished: "half" },
  ];
  for (const bad of bads) {
    assert.deepEqual(checkOrder(form({ ...base, ...bad }), today), { ok: false, error: "house_facts" }, JSON.stringify(bad));
  }
  const nextYear = checkOrder(form({ ...base, year_built: "2027" }), today); // a new build finishing next year
  assert.ok(nextYear.ok);
});
