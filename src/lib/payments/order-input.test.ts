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
