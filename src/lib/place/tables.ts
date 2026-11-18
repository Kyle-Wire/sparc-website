// The site's own copy of three FEMA tables, read one state at a time.
//
// The files are built by scripts/build-fema-tables.mjs and committed under
// src/data/fema. Each loader answers null when the copy holds no file for a
// state, and the caller then asks FEMA live, so a state the copy lacks still
// works. A file that exists is trusted: a tract or county missing from it has
// no rows in FEMA's table.
//
// A state's file is read once per server process and kept.

import manifest from "@/data/fema/manifest.json";

export interface ClaimsFile {
  /** tract -> [year, count, year, count, ...], oldest first */
  tracts: Record<string, number[]>;
}

/** [disaster number, yyyy-mm-dd declared, FEMA's incident type, title], newest first */
export type DeclarationRow = [number, string, string, string];

export interface DeclarationsFile {
  counties: Record<string, DeclarationRow[]>;
}

export interface RiskFile {
  version: string | null;
  /** The field each character of a tract's code stands for, in order. */
  fields: string[];
  /** FEMA's rating word -> the character that stands for it. */
  codes: Record<string, string>;
  tracts: Record<string, string>;
}

interface TableNote {
  /** The day the copy was taken, yyyy-mm-dd. */
  copied?: string;
  femaLastRefresh?: string | null;
  femaVersion?: string | null;
  claimsRead?: number;
  claimsNotLocated?: number;
}

const NOTES = manifest as Record<string, TableNote | undefined>;

export function tableNote(table: "claims" | "declarations" | "risk"): TableNote | null {
  return NOTES[table] ?? null;
}

const kept = new Map<string, Promise<unknown | null>>();

function once<T>(key: string, load: () => Promise<{ default: unknown }>): Promise<T | null> {
  let p = kept.get(key);
  if (!p) {
    p = load()
      .then((m) => m.default)
      .catch(() => null);
    kept.set(key, p);
  }
  return p as Promise<T | null>;
}

const STATE = /^\d{2}$/;

export function claimsFile(state: string): Promise<ClaimsFile | null> {
  if (!STATE.test(state)) return Promise.resolve(null);
  return once(`claims/${state}`, () => import(`@/data/fema/claims/${state}.json`));
}

export function declarationsFile(state: string): Promise<DeclarationsFile | null> {
  if (!STATE.test(state)) return Promise.resolve(null);
  return once(`declarations/${state}`, () => import(`@/data/fema/declarations/${state}.json`));
}

export function riskFile(state: string): Promise<RiskFile | null> {
  if (!STATE.test(state)) return Promise.resolve(null);
  return once(`risk/${state}`, () => import(`@/data/fema/risk/${state}.json`));
}
