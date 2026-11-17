"use client";

// Your places: saved places and recently viewed ones, kept in this browser.
//
// There is no account behind this yet. Everything here lives in the visitor's
// own localStorage and is never sent to the server. What is kept is a block
// (the rounded place the page address already carries), the name of its town,
// a note the visitor typed, and a snapshot of the headline records on the day
// it was saved, so that coming back shows what the record said then.
//
// No address is kept. See docs/design/site-redesign-brief.md, section 8.

import { useSyncExternalStore } from "react";
import type { Glance } from "@/lib/place/summary";

export interface SavedPlace {
  slug: string;
  where: string;
  /** ISO date-time of the save. */
  savedAt: string;
  note: string;
  /** The headline records as they stood when the place was saved. */
  glance: Glance;
}

export interface RecentPlace {
  slug: string;
  where: string;
  seenAt: string;
}

const SAVED_KEY = "sparc.places.saved.v1";
const RECENT_KEY = "sparc.places.recent.v1";
const CHANGED = "sparc:places-changed";
const MAX_SAVED = 50;
const MAX_RECENT = 8;

/* ---- a tiny store over localStorage, readable with useSyncExternalStore ---- */

function makeStore<T>(key: string) {
  const empty: T[] = [];
  let cachedRaw: string | null = null;
  let cached: T[] = empty;

  function read(): T[] {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return empty;
    }
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cached = Array.isArray(parsed) ? (parsed as T[]) : empty;
    } catch {
      cached = empty;
    }
    return cached;
  }

  function write(next: T[]): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Storage refused (private window, full disk). Nothing is saved; the page still works.
    }
    window.dispatchEvent(new Event(CHANGED));
  }

  function subscribe(onChange: () => void): () => void {
    window.addEventListener("storage", onChange);
    window.addEventListener(CHANGED, onChange);
    return () => {
      window.removeEventListener("storage", onChange);
      window.removeEventListener(CHANGED, onChange);
    };
  }

  return { read, write, subscribe, serverSnapshot: () => empty };
}

const savedStore = makeStore<SavedPlace>(SAVED_KEY);
const recentStore = makeStore<RecentPlace>(RECENT_KEY);

export function useSavedPlaces(): SavedPlace[] {
  return useSyncExternalStore(savedStore.subscribe, savedStore.read, savedStore.serverSnapshot);
}

export function useRecentPlaces(): RecentPlace[] {
  return useSyncExternalStore(recentStore.subscribe, recentStore.read, recentStore.serverSnapshot);
}

/* ---- changes ---- */

export function savePlace(slug: string, glance: Glance): void {
  const rest = savedStore.read().filter((p) => p.slug !== slug);
  const entry: SavedPlace = { slug, where: glance.where, savedAt: new Date().toISOString(), note: "", glance };
  savedStore.write([entry, ...rest].slice(0, MAX_SAVED));
}

export function removePlace(slug: string): void {
  savedStore.write(savedStore.read().filter((p) => p.slug !== slug));
}

export function setPlaceNote(slug: string, note: string): void {
  savedStore.write(savedStore.read().map((p) => (p.slug === slug ? { ...p, note: note.slice(0, 2000) } : p)));
}

export function recordVisit(slug: string, where: string): void {
  const rest = recentStore.read().filter((p) => p.slug !== slug);
  recentStore.write([{ slug, where, seenAt: new Date().toISOString() }, ...rest].slice(0, MAX_RECENT));
}

export function clearRecent(): void {
  recentStore.write([]);
}
