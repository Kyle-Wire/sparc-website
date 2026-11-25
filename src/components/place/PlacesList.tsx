"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { GlanceRow } from "./glance";
import { clearRecent, removePlace, setPlaceNote, useRecentPlaces, useSavedPlaces } from "./saved-places";

const MAX_COMPARE = 4;

function day(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/** Saved and recently viewed places, read from this browser. */
export function PlacesList() {
  const saved = useSavedPlaces();
  const recent = useRecentPlaces();
  const [picked, setPicked] = useState<string[]>([]);

  const toggle = (slug: string) =>
    setPicked((now) =>
      now.includes(slug) ? now.filter((s) => s !== slug) : now.length < MAX_COMPARE ? [...now, slug] : now,
    );
  const chosen = picked.filter((s) => saved.some((p) => p.slug === s));
  const compareHref = `/compare?${chosen.map((s) => `p=${encodeURIComponent(s)}`).join("&")}` as Route;

  return (
    <>
      {saved.length === 0 ? (
        <div className="card dashed" style={{ padding: 28, maxWidth: 720 }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>Nothing saved yet.</h2>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 16px" }}>
            Look up an address and press <strong>Save this place</strong>. It will be kept here, in this
            browser, with your note and a snapshot of what the record said that day.
          </p>
          <Link className="btn btn-accent" href="/map">
            Look up an address <span className="arrow">→</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="places-bar">
            <p>
              {chosen.length < 2
                ? `Tick two to ${MAX_COMPARE} places to compare them side by side.`
                : `${chosen.length} places chosen.`}
            </p>
            {chosen.length >= 2 ? (
              <Link className="btn btn-accent" href={compareHref}>
                Compare {chosen.length} places <span className="arrow">→</span>
              </Link>
            ) : (
              <span className="btn" aria-disabled="true" style={{ opacity: 0.5, cursor: "default" }}>
                Compare
              </span>
            )}
          </div>

          <div className="places-list">
            {saved.map((p) => (
              <article key={p.slug} className="place-saved">
                <header>
                  <label className="place-saved-pick">
                    <input
                      type="checkbox"
                      checked={picked.includes(p.slug)}
                      onChange={() => toggle(p.slug)}
                      aria-label={`Compare the block in ${p.where}`}
                    />
                    <span>
                      <strong>A block in {p.where}</strong>
                      <small>Saved {day(p.savedAt)} · the record as it stood that day</small>
                    </span>
                  </label>
                  <div className="row" style={{ gap: 8 }}>
                    <Link className="btn btn-sm btn-primary" href={`/place/${p.slug}` as Route}>
                      Open today&apos;s record
                    </Link>
                    <button type="button" className="btn btn-sm" onClick={() => removePlace(p.slug)}>
                      Remove
                    </button>
                  </div>
                </header>
                <GlanceRow glance={p.glance} />
                <label className="label" htmlFor={`note-${p.slug}`} style={{ marginTop: 14 }}>
                  Your note
                </label>
                <textarea
                  id={`note-${p.slug}`}
                  className="input"
                  rows={2}
                  value={p.note}
                  placeholder="What you noticed on the visit, what to ask, how it compares."
                  onChange={(e) => setPlaceNote(p.slug, e.target.value)}
                />
              </article>
            ))}
          </div>
        </>
      )}

      <div className="places-recent">
        <div className="shelf-head">
          <h3>Recently viewed</h3>
          <span className="shelf-state">on this device</span>
        </div>
        {recent.length === 0 ? (
          <p className="record-aside">Places you look at will be listed here.</p>
        ) : (
          <>
            <ul>
              {recent.map((r) => (
                <li key={r.slug}>
                  <Link href={`/place/${r.slug}` as Route}>A block in {r.where}</Link>
                  <small> · {day(r.seenAt)}</small>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-sm" onClick={clearRecent}>
              Clear this list
            </button>
          </>
        )}
      </div>
    </>
  );
}
