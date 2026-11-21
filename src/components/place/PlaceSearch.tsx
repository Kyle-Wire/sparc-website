"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { rememberPoint } from "./place-point";

interface GeocodeAnswer {
  slug?: string;
  point?: { lat: number; lon: number };
  matched?: string;
  /** "street": the second search knew the street but not the house. */
  precision?: "house" | "street";
  by?: "census" | "photon";
  error?: string;
}

export interface FoundPlace {
  slug: string;
  point: { lat: number; lon: number };
  precision: "house" | "street";
  /** The address as the locator wrote it. */
  matched: string;
}

/** What to say once an address is found by the second search. OpenStreetMap's
 *  data is credited wherever a place found with it is shown (ODbL). */
function foundNote(a: GeocodeAnswer): string | null {
  if (a.by !== "photon") return null;
  const credit = "Found with OpenStreetMap data, © OpenStreetMap contributors.";
  return a.precision === "street"
    ? `Found the street (${a.matched}), not the house. Click the house on the map to drop a pin on it. ${credit}`
    : `${credit}`;
}

/**
 * The search box. An address goes to /api/geocode in the request body and
 * comes back as a block. The exact point is remembered in this browser tab
 * only; the page we navigate to carries the block.
 */
export function PlaceSearch({
  compact,
  bare,
  onFound,
  help,
}: {
  compact?: boolean;
  /** For the floating bar on the home map: the label is read by screen
   *  readers only, and the line under the box shows only an error or a note. */
  bare?: boolean;
  /** When given, a found address is handed back (the home map flies to it)
   *  instead of opening its place page. */
  onFound?: (found: FoundPlace) => void;
  /** Replaces the line under the box. */
  help?: string;
}) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const text = address.trim();
    if (text.length < 5) {
      setError("Type a street address with its city and state.");
      return;
    }
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: text }),
      });
      const answer = (await res.json()) as GeocodeAnswer;
      if (!res.ok || !answer.slug || !answer.point) {
        setError(answer.error ?? "The search did not work. Try again.");
        setBusy(false);
        return;
      }
      const precision = answer.precision ?? "house";
      setNote(foundNote(answer));
      if (onFound) {
        // A point on the street is not the house: it is not kept as the property.
        if (precision === "house") rememberPoint({ slug: answer.slug, ...answer.point, matched: answer.matched ?? "" });
        onFound({ slug: answer.slug, point: answer.point, precision, matched: answer.matched ?? "" });
        setBusy(false);
        return;
      }
      if (precision === "street") {
        setBusy(false);
        return;
      }
      rememberPoint({ slug: answer.slug, ...answer.point, matched: answer.matched ?? "" });
      router.push(`/place/${answer.slug}` as Route);
    } catch {
      setError("The search did not work. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="place-search" data-compact={compact ? "true" : undefined} data-bare={bare ? "true" : undefined}>
      <label className={bare ? "visually-hidden" : "label"} htmlFor="place-search-input">
        Street address, city, state
      </label>
      <div className="place-search-row">
        <input
          id="place-search-input"
          className="input"
          type="text"
          name="address"
          autoComplete="street-address"
          placeholder="Any address in the United States"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-describedby="place-search-help"
          aria-invalid={error ? true : undefined}
        />
        <button className="btn btn-accent" type="submit" disabled={busy}>
          {busy ? "Looking…" : "Look it up"} <span className="arrow">→</span>
        </button>
      </div>
      {(!bare || error || note) && (
        <p id="place-search-help" className="place-search-help" role={error ? "alert" : undefined}>
          {error ??
            note ??
            help ??
            "Free, no account. The address is used to find the block and is not stored; the page you land on shows the neighbourhood, not the house."}
        </p>
      )}
    </form>
  );
}
