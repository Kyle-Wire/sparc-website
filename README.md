# sparclabs.co — SPARC Labs

Next.js 16 (App Router, TypeScript) site for **SPARC Labs**. Environmental
screening for home buyers: look up any US address and see the public record
around it (flood zones, flood insurance claims, disaster declarations, storm
tracks, sea level rise), free. The company's own flood and heat models are the
paid part and are not on the site yet.

The direction, what is built and what is not: [`docs/design/site-redesign-brief.md`](docs/design/site-redesign-brief.md).
This is a first draft of the redesign. The gated `/account/*` portal, Supabase
auth and Lemon Squeezy billing below are from the earlier site and unchanged.

## Place pages

- `/` is the search box. `POST /api/geocode` turns an address into a block
  (coordinates rounded to three decimals) through the US Census Bureau's
  geocoder. The address is not stored and never appears in a URL.
- `/place/<lat>,<lon>` asks the public registers about that block from the
  server ([`src/lib/place/`](src/lib/place)) and draws a map of public layers
  ([`src/components/place/PlaceMap.tsx`](src/components/place/PlaceMap.tsx)).
- Storm tracks come from a committed file built from NOAA's HURDAT2:
  `npm run data:hurricanes` rebuilds `src/data/hurricane-tracks.json` and its manifest.
- The map library's worker is copied into `public/vendor/` before every `dev`
  and `build` (`scripts/copy-map-worker.mjs`); that folder is git-ignored.

## Stack

- **Next.js 16** (App Router · typed routes · server components by default)
- **maplibre-gl 6** for the place map; public raster layers from USGS, FEMA, NOAA and MRLC
- **Supabase** for auth (magic link + Google + Microsoft) and storage; Vault for BYOK secrets
- **Lemon Squeezy** for billing (Pursue, Converge per-seat); Transcend = sales-assisted
- **Plain CSS** with [`tokens.css`](src/styles/tokens.css) as the design source of truth
- Brand strings live exclusively in [`src/lib/brand.ts`](src/lib/brand.ts)

## Setup

```bash
cd sparc-website
pnpm install          # or: npm install
cp .env.example .env.local   # fill in Supabase + Lemon Squeezy values
pnpm dev              # http://localhost:3000
```

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server Supabase clients |
| `SUPABASE_SERVICE_ROLE_KEY` | Webhook + admin operations only — never exposed to the browser |
| `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID` | Checkout creation |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | HMAC verification on `/api/lemonsqueezy/webhook` |
| `LEMONSQUEEZY_VARIANT_PURSUE_{MONTHLY,YEARLY}` | Variant IDs for Pursue plan |
| `LEMONSQUEEZY_VARIANT_CONVERGE_{MONTHLY,YEARLY}` | Variant IDs for Converge plan |
| `RESEND_API_KEY`, `WAITLIST_NOTIFY_EMAIL` | Optional waitlist notifications |
| `NEXT_PUBLIC_SITE_URL` | Optional override (defaults to `https://sparclabs.co`) |

## Database

Apply [`supabase/migrations/0001_initial.sql`](supabase/migrations/0001_initial.sql)
to provision tables (`profiles`, `subscriptions`, `orders`, `seats`, `license_keys`,
`api_keys`, `desktop_sessions`, `usage_events`, `waitlist`) with strict RLS.

## Auth flow

| Surface | Path | Notes |
|---|---|---|
| Web sign-in | `/login` | Magic link or OAuth |
| Web sign-up | `/signup` | Same form, `shouldCreateUser: true` |
| Callback | `/auth/callback` | Exchanges `code` → cookie session |
| Desktop deep-link | `/auth/callback?desktop=1&state=…` | Bounces to `sparc://auth/callback?code=…&state=…` |
| Sign out | `POST /auth/signout` | |

## Billing flow

1. User picks a plan on `/pricing` → `GET /api/checkout?tier=…&period=…`
2. We create a Lemon Squeezy checkout with `custom_data.user_id`
3. LS posts to `/api/lemonsqueezy/webhook` (HMAC-verified) and we upsert `subscriptions`
4. User manages billing at `/account/subscription` → `/api/portal`

## Account portal

`/account` (gated by middleware): overview, subscription, seats, downloads & licenses,
BYOK API keys, usage, devices, settings.

## Deploy

Vercel. Set env vars; point `sparclabs.co` at the project. The Lemon Squeezy webhook
URL is `https://sparclabs.co/api/lemonsqueezy/webhook`.

## Verify

```bash
npm run typecheck
npm run lint            # eslint, warnings fail it too
npm run check:design    # placeholder source scan + colour tokens
npm run build
npm run check:placeholders:rendered   # after the build: reads .next/server/app
npm run security:audit  # high/critical advisories in production dependencies
```

CI (`.github/workflows/ci.yml`) runs exactly these on every push and pull request, against `package-lock.json` via `npm ci`; the audit also runs weekly. Merging deploys the live site, so a red check means do not merge.
