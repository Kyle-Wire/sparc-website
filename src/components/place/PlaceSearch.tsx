"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { rememberPoint } from "./place-point";

interface GeocodeAnswer {
  slug?: string;
  point?: { lat: number; lon: number };
  matched?: string;
  error?: string;
}

/**
 * The search box. An address goes to /api/geocode in the request body and
 * comes back as a block. The exact point is remembered in this browser tab
 * only; the page we navigate to carries the block.
 */
export function PlaceSearch({
  compact,
  onFound,
  help,
}: {
  compact?: boolean;
  /** When given, a found address is handed back (the home map flies to it)
   *  instead of opening its place page. */
  onFound?: (found: { slug: string; point: { lat: number; lon: number } }) => void;
  /** Replaces the line under the box. */
  help?: string;
}) {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      rememberPoint({ slug: answer.slug, ...answer.point, matched: answer.matched ?? "" });
      if (onFound) {
        onFound({ slug: answer.slug, point: answer.point });
        setBusy(false);
        return;
      }
      router.push(`/place/${answer.slug}` as Route);
    } catch {
      setError("The search did not work. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="place-search" data-compact={compact ? "true" : undefined}>
      <label className="label" htmlFor="place-search-input">
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
      <p id="place-search-help" className="place-search-help" role={error ? "alert" : undefined}>
        {error ??
          help ??
          "Free, no account. The address is used to find the block and is not stored; the page you land on shows the neighbourhood, not the house."}
      </p>
    </form>
  );
}
