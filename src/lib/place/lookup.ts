// One shape for every public-record lookup, and one way to ask.
//
// A lookup either has an answer or says why it has none. It never throws into
// a page: a place page is five independent registers, and one of them being
// down must cost one card, not the page. FEMA's map server in particular drops
// connections when it is busy (seen while testing, 17 Nov 2026).

/** `final` marks an answer that asking again will not change: the source does
 *  not cover the place. Without it, the source failed to answer this time. */
export type Lookup<T> = { ok: true; data: T } | { ok: false; reason: string; final?: boolean };

export const DAY_SECONDS = 86_400;

interface AskOptions {
  /** Seconds to keep the answer. Omit for no caching (anything with an address in it). */
  revalidate?: number;
  timeoutMs?: number;
  /** Ask again this many times if the connection fails or the server errors. */
  retries?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A plain client name. No contact details: nothing about the visitor or the
 *  company's people goes to an outside service. */
const USER_AGENT = "sparclabs-site/1 (public record lookup)";

export async function askJson<T>(url: string, who: string, opts: AskOptions = {}): Promise<Lookup<T>> {
  const { retries = 0, ...once } = opts;
  let last = await askOnce<T>(url, who, once);
  for (let i = 0; i < retries && !last.ok; i++) {
    await sleep(900 * (i + 1));
    last = await askOnce<T>(url, who, once);
  }
  return last;
}

/** The same, for a source that answers with a file rather than JSON. */
export async function askBytes(url: string, who: string, opts: AskOptions = {}): Promise<Lookup<ArrayBuffer>> {
  const { retries = 0, revalidate, timeoutMs = 20_000 } = opts;
  let last: Lookup<ArrayBuffer> = { ok: false, reason: `${who} did not answer. Try again in a minute.` };
  for (let i = 0; i <= retries; i++) {
    if (i > 0) await sleep(900 * i);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(timeoutMs),
        ...(revalidate ? { next: { revalidate } } : { cache: "no-store" as const }),
      });
      if (res.ok) return { ok: true, data: await res.arrayBuffer() };
      last = { ok: false, reason: `${who} answered with an error (${res.status}).` };
    } catch {
      last = { ok: false, reason: `${who} did not answer. Try again in a minute.` };
    }
  }
  return last;
}

async function askOnce<T>(url: string, who: string, opts: AskOptions): Promise<Lookup<T>> {
  const { revalidate, timeoutMs = 15_000 } = opts;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
      ...(revalidate ? { next: { revalidate } } : { cache: "no-store" as const }),
    });
    if (!res.ok) return { ok: false, reason: `${who} answered with an error (${res.status}).` };
    const body = (await res.json()) as T & { error?: unknown };
    if (body && typeof body === "object" && "error" in body && body.error) {
      return { ok: false, reason: `${who} could not answer this request.` };
    }
    return { ok: true, data: body };
  } catch {
    return { ok: false, reason: `${who} did not answer. Try again in a minute.` };
  }
}
