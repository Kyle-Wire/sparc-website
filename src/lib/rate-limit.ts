// Rate limiting backed by Upstash Redis (works on serverless / edge runtimes).
//
// Activates only when both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// are set. Otherwise calls return { success: true } so local dev and unconfigured
// environments behave normally. The Upstash packages are loaded dynamically so
// they don't have to be installed for the app to build.
//
// Install before enabling:
//   npm i @upstash/ratelimit @upstash/redis

import type { NextRequest } from "next/server";

type Bucket = "publicForm" | "auth" | "apiWrite";

interface LimiterLike {
  limit: (key: string) => Promise<{ success: boolean; reset: number; remaining: number }>;
}

const cache = new Map<Bucket, LimiterLike | null>();
let initialized = false;

async function getLimiter(bucket: Bucket): Promise<LimiterLike | null> {
  if (cache.has(bucket)) return cache.get(bucket) ?? null;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    cache.set(bucket, null);
    return null;
  }

  try {
    // Dynamic import so the dependency is optional; suppress type resolution
    // because @upstash/* are only installed when rate limiting is enabled.
    // @ts-expect-error - optional peer dependency, may not be installed
    const ratelimitMod = await import("@upstash/ratelimit");
    // @ts-expect-error - optional peer dependency, may not be installed
    const redisMod = await import("@upstash/redis");
    const { Ratelimit } = ratelimitMod as { Ratelimit: new (opts: unknown) => LimiterLike & { slidingWindow?: unknown } };
    const { Redis } = redisMod as { Redis: new (opts: { url: string; token: string }) => unknown };
    const RatelimitCtor = Ratelimit as unknown as {
      new (opts: unknown): LimiterLike;
      slidingWindow: (tokens: number, window: string) => unknown;
    };
    const redis = new Redis({ url, token });
    const config: Record<Bucket, { tokens: number; window: `${number} ${"s" | "m" | "h"}` }> = {
      publicForm: { tokens: 5, window: "1 m" },
      auth: { tokens: 10, window: "1 m" },
      apiWrite: { tokens: 30, window: "1 m" },
    };
    const limiter = new RatelimitCtor({
      redis,
      limiter: RatelimitCtor.slidingWindow(config[bucket].tokens, config[bucket].window),
      prefix: `rl:${bucket}`,
      analytics: false,
    });
    cache.set(bucket, limiter);
    return limiter;
  } catch (err) {
    if (!initialized) {
      console.warn("[rate-limit] Upstash packages not installed; limits disabled.", err);
      initialized = true;
    }
    cache.set(bucket, null);
    return null;
  }
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

/**
 * Check a rate-limit bucket. Always resolves; on misconfiguration or transport
 * error it returns { ok: true } (fail-open) to avoid hard outages.
 */
export async function checkRateLimit(bucket: Bucket, key: string): Promise<RateLimitResult> {
  const limiter = await getLimiter(bucket);
  if (!limiter) return { ok: true };
  try {
    const r = await limiter.limit(key);
    if (r.success) return { ok: true };
    const retry = Math.max(1, Math.ceil((r.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSeconds: retry };
  } catch (err) {
    console.warn("[rate-limit] check failed; failing open:", err);
    return { ok: true };
  }
}
