/**
 * The order form, checked on the server. Pure, so it is tested without a
 * database (order-input.test.ts).
 */

import { parsePlaceSlug, placeSlug } from "../place/coords";

export interface OrderInput {
  address: string;
  note: string | null;
  placeSlug: string | null;
  agreed: boolean;
}

export type OrderCheck = { ok: true; value: OrderInput } | { ok: false; error: string };

const clean = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]+/g, " ").trim() : "");

export function checkOrder(form: FormData): OrderCheck {
  const address = clean(form.get("address")).replace(/\s+/g, " ");
  const note = clean(form.get("note"));
  const place = clean(form.get("place"));
  const agreed = form.get("agree") === "yes";

  if (address.length < 5) return { ok: false, error: "address" };
  if (address.length > 300) return { ok: false, error: "address" };
  if (!/\d/.test(address)) return { ok: false, error: "address" }; // a street address has a number
  if (note.length > 2000) return { ok: false, error: "note" };
  if (!agreed) return { ok: false, error: "agree" };

  const p = place ? parsePlaceSlug(place) : null;
  return { ok: true, value: { address, note: note || null, placeSlug: p ? placeSlug(p) : null, agreed } };
}

export const ORDER_ERRORS: Record<string, string> = {
  address: "Please give the property's street address, with its number, city and state.",
  note: "The note is too long. Keep it under 2,000 characters.",
  agree: "Please tick the box to say you have read what the report is and is not.",
  checkout: "We could not open the checkout. Nothing was charged. Please try again in a minute.",
  unavailable: "Reports are not on sale yet. Nothing was charged.",
  unconfigured: "Checkout is not set up yet. Nothing was charged.",
};
