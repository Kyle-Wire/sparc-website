# Tier 1 Handoff — What I Did and What You Need to Do

## What I shipped (code + remote already applied)

### 1. Supabase performance migration — **applied to remote**
- New file: [`supabase/migrations/0005_perf_and_indexes.sql`](supabase/migrations/0005_perf_and_indexes.sql)
- Rewrote every `auth.uid()` inside RLS to `(select auth.uid())` — fixes 12 `auth_rls_initplan` warnings.
- Consolidated three overlapping `seats` SELECT policies into one `seats_self_read` plus split-out write policies — fixes 5 `multiple_permissive_policies` warnings.
- Added `orders_user_id_idx` and `seats_member_id_idx` — fixes 2 `unindexed_foreign_keys` warnings.
- **Verified**: re-ran the Supabase performance advisor, all 15 WARN-level items are gone. The two remaining notices are INFO-level "unused index" — expected, will resolve once those tables see traffic.

### 2. Vercel Analytics + Speed Insights — **wired up locally**
- Installed `@vercel/analytics` and `@vercel/speed-insights`.
- Added `<Analytics />` and `<SpeedInsights />` to [`src/app/layout.tsx`](src/app/layout.tsx).
- `npm run typecheck` and `npm run build` both pass.

---

## What you need to do (cannot be done from here)

### A. Repair Supabase migration history (CLI, ~2 minutes)

This is the migration drift issue. Your local files (`0001_initial.sql` through `0004_db_hardening.sql`) were applied via the SQL editor, so the remote `supabase_migrations.schema_migrations` table didn't have them recorded. I just applied `0005` via the MCP, which registered it under timestamp `20260502225504_perf_and_indexes` instead of `0005_perf_and_indexes`.

Run these commands from the repo root (you'll need `supabase login` first if not already):

```bash
# 1. Link the local repo to the remote project (only needed once)
supabase link --project-ref dugemitlmtsuztpwxehy

# 2. Mark the MCP-applied entry as reverted (it'll be replaced by 0005)
supabase migration repair --status reverted 20260502225504

# 3. Mark all five local files as applied (the SQL is already in the database)
supabase migration repair --status applied 0001 0002 0003 0004 0005

# 4. Confirm local and remote agree
supabase migration list
```

After step 4 you should see `0001 / 0002 / 0003 / 0004 / 0005` all marked as applied locally **and** remotely. From then on `supabase db push` works normally for future migrations.

### B. Delete the duplicate Vercel project (1 minute)

[Vercel Dashboard](https://vercel.com/kyle-wires-projects) → `sparc-website-z36m` → Settings → bottom of page → **Delete Project**. Confirm no domains/env vars are attached first (they shouldn't be).

### C. Verify Resend sending domain (~10 minutes work + waiting on DNS)

1. [Resend Dashboard](https://resend.com/domains) → **Add Domain** → `sparclabs.co`.
2. Resend will give you SPF, DKIM (3 records), and optionally DMARC records.
3. Add them at whichever DNS host you end up using (see step E for that decision).
4. Click **Verify** in Resend after DNS propagates (usually <15 min, can take up to a few hours).
5. Confirm `RESEND_FROM` in Vercel env (Production scope) is `SPARC Labs <hello@sparclabs.co>`.
6. Test by submitting the waitlist form on production after step F lands — the notification email should arrive **from `hello@sparclabs.co`**, not `onboarding@resend.dev`.

### D. Enable Vercel Web Analytics + Speed Insights (1 minute)

The code is already deployed once you push. To turn on data collection:

1. [Vercel Dashboard](https://vercel.com/kyle-wires-projects/sparc-website) → **Analytics** tab → **Enable Web Analytics**.
2. Same project → **Speed Insights** tab → **Enable**.

(Both are on the free tier for hobby/pro plans.)

### E. **DECISION REQUIRED**: Choose your DNS path

I need you to pick one before doing step F. The trade-offs are in [the plan file](/Users/kylewire/.claude/plans/i-ve-recently-provided-access-rosy-newell.md#dns-trade-off--cloudflare-proxied-vs-registrar-direct). My recommendation is **Option B (Cloudflare-proxied)** — you already use Cloudflare Turnstile, the WAF/Bot Fight value is real for an account-portal site, and it makes future R2 / Email Routing trivial. But Option A (registrar-direct) is faster to ship today.

Tell me which one you want and I'll walk you through the exact steps.

### F. Attach `sparclabs.co` to Vercel (5 minutes after E is decided)

After you pick the DNS path, the steps are:

1. [Vercel Dashboard](https://vercel.com/kyle-wires-projects/sparc-website) → Settings → Domains → **Add** → `sparclabs.co` and `www.sparclabs.co`.
2. Vercel will tell you the exact DNS records to add. Typically:
   - Apex `sparclabs.co` → A record `76.76.21.21`.
   - `www.sparclabs.co` → CNAME `cname.vercel-dns.com`.
3. Add the records at your DNS host (per your decision in E).
4. Wait for cert issuance (usually <2 minutes once DNS resolves).
5. Confirm `NEXT_PUBLIC_SITE_URL=https://sparclabs.co` is set in Vercel env (Production scope).
6. [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com/) → Settings → Webhooks → confirm endpoint is `https://sparclabs.co/api/lemonsqueezy/webhook`.

---

## Verification checklist (when all of the above is done)

- [ ] `supabase migration list` shows 0001/0002/0003/0004/0005 applied both locally and remotely.
- [ ] `https://sparclabs.co` loads with valid TLS.
- [ ] Test signup at `https://sparclabs.co/signup` → confirmation email arrives from `hello@sparclabs.co`.
- [ ] Waitlist form submission still works (Turnstile + Resend notification).
- [ ] Test Lemon Squeezy purchase (test mode) → webhook hits `https://sparclabs.co/api/lemonsqueezy/webhook` and `public.subscriptions` is upserted.
- [ ] Vercel project list shows only `sparc-website` (no `-z36m`).
- [ ] Vercel Analytics dashboard shows traffic; Speed Insights shows Core Web Vitals.

---

## What's queued for next cycle (Tier 2)

You greenlit all four. Will be planned separately:
1. OAuth: Google + Microsoft + GitHub
2. MFA (TOTP) with AAL2 enforcement on `/account/api-keys` + `/account/seats`
3. Account deletion + data export (GDPR)
4. Audit log table + `/account/security` view
