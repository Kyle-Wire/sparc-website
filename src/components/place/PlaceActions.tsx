"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Glance } from "@/lib/place/summary";
import { recordVisit, removePlace, savePlace, setPlaceNote, useSavedPlaces } from "./saved-places";

/**
 * Save, share and print for a place page.
 *
 * Saving keeps the place in this browser, with a note and a snapshot of the
 * headline records (see saved-places.ts). Sharing copies the page address,
 * which holds the block and not a house. Printing uses the browser's own
 * print, which can also save a PDF.
 */
export function PlaceActions({ slug, glance }: { slug: string; glance: Glance }) {
  const saved = useSavedPlaces();
  const mine = saved.find((p) => p.slug === slug);
  const [copied, setCopied] = useState(false);

  // Keep a short "recently viewed" list on this device.
  useEffect(() => {
    recordVisit(slug, glance.where);
  }, [slug, glance.where]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard refused. The address bar still has the link.
    }
  }

  return (
    <div className="place-actions">
      <div className="place-actions-row">
        <button
          type="button"
          className={mine ? "btn btn-primary" : "btn btn-accent"}
          aria-pressed={Boolean(mine)}
          onClick={() => (mine ? removePlace(slug) : savePlace(slug, glance))}
        >
          {mine ? "Saved ✓" : "Save this place"}
        </button>
        <button type="button" className="btn" onClick={copyLink}>
          {copied ? "Link copied" : "Copy link"}
        </button>
        <button type="button" className="btn" onClick={() => window.print()}>
          Print or save as PDF
        </button>
        <Link className="btn btn-ghost" href="/places">
          Your places{saved.length ? ` (${saved.length})` : ""}
        </Link>
      </div>

      {mine && (
        <div className="place-note">
          <label className="label" htmlFor="place-note-input">
            Your note on this place
          </label>
          <textarea
            id="place-note-input"
            className="input"
            rows={2}
            value={mine.note}
            placeholder="What you noticed on the visit, what to ask, how it compares."
            onChange={(e) => setPlaceNote(slug, e.target.value)}
          />
          <small>
            Saved in this browser only, with a snapshot of today&apos;s record. Nothing is sent to us, and no
            address is kept.
          </small>
        </div>
      )}
    </div>
  );
}
