# Cloudflare-Proxied DNS for sparclabs.co → Vercel

End-to-end setup: change nameservers to Cloudflare, proxy traffic through Cloudflare to Vercel, get TLS, set up email DNS for Resend. Plan ~30 minutes of your time + DNS propagation wait (often <30 min, can be up to 24 hours).

## ⚠️ The two non-obvious gotchas

1. **SSL/TLS mode must be `Full (strict)`** — never Flexible. Flexible causes infinite redirect loops with Vercel because Vercel always serves HTTPS. Full (strict) works because Vercel presents a valid Let's Encrypt cert.
2. **Apex (`sparclabs.co`) goes proxied (orange cloud); `www` goes proxied too.** Vercel verifies the domain via TXT records when proxied through Cloudflare — that's normal.

---

## Step 1 — Add `sparclabs.co` to Cloudflare

1. Go to <https://dash.cloudflare.com> → click **+ Add a domain** (top right).
2. Enter `sparclabs.co` → click Continue.
3. Pick **Free** plan → Continue.
4. Cloudflare scans your existing DNS records. **Review them** — anything currently pointing at Vercel preview domains, mail providers, or verification records should be there. Click Continue (we'll add/edit records in Step 4).
5. Cloudflare gives you **two nameservers**, e.g.:
   - `something.ns.cloudflare.com`
   - `something-else.ns.cloudflare.com`
   - **Copy both — you'll need them for Step 2.**

## Step 2 — Change nameservers at your registrar

This step depends on where you bought `sparclabs.co`. Common ones:

- **Namecheap**: Account → Domain List → Manage → Nameservers dropdown → "Custom DNS" → paste both Cloudflare nameservers → ✓ Save.
- **Google Domains / Squarespace Domains**: DNS → Nameservers → "Use custom name servers" → paste both → Save.
- **GoDaddy**: My Products → Domains → DNS → Nameservers → Change → "Enter my own nameservers" → paste both → Save.
- **Porkbun**: Domain Management → Authoritative Nameservers → replace defaults → Save.
- **Cloudflare Registrar**: skip this step (already on Cloudflare nameservers).

After saving, propagation usually takes 5–60 minutes but can take up to 24 hours. Cloudflare will email you ("Your domain `sparclabs.co` is now active on Cloudflare") when it sees the change.

## Step 3 — Set SSL/TLS encryption mode to Full (strict)

**Do this BEFORE the site goes "Active" if possible** — prevents accidental redirect loops on first request.

1. In the Cloudflare dashboard, pick `sparclabs.co` from your sites list.
2. Left sidebar → **SSL/TLS** → **Overview**.
3. Set **Encryption mode** to **Full (strict)**.
4. Same SSL/TLS section → **Edge Certificates** → make sure **Always Use HTTPS** is ON, and **Automatic HTTPS Rewrites** is ON.

## Step 4 — Add `sparclabs.co` to Vercel and get the records to add

1. Go to <https://vercel.com/kyle-wires-projects/sparc-website/settings/domains>.
2. Click **Add Domain** → enter `sparclabs.co` → click Add.
3. Vercel will ask you to choose a redirect/canonical setup — pick "**Add `sparclabs.co` and redirect `www.sparclabs.co` to it**" (cleaner) **OR** the reverse if you prefer www-canonical. Common choice for SaaS: bare apex canonical.
4. Vercel will then show you the **DNS records to add**. Because it can't currently reach Vercel via the domain, it'll tell you to add either:
   - **A record** for the apex pointing at `76.76.21.21`, **or**
   - A **TXT verification record** if A is unreachable.
5. **Leave this Vercel page open** — you'll come back to it after Step 5 to click "Verify."

## Step 5 — Add DNS records in Cloudflare

Cloudflare → `sparclabs.co` → **DNS** → **Records** tab → **Add record** for each:

| Type | Name | Content | Proxy | TTL |
|---|---|---|---|---|
| A | `sparclabs.co` (or `@`) | `76.76.21.21` | **Proxied** (orange cloud) | Auto |
| CNAME | `www` | `cname.vercel-dns.com` | **Proxied** (orange cloud) | Auto |

(If Vercel gave you a different A target or a TXT verification record, use those instead — Vercel's UI is authoritative.)

If Cloudflare's auto-import from Step 1 brought over old/conflicting A or CNAME records on the apex or www, **delete them** before adding the new ones.

Click **Save** for each.

## Step 6 — Verify in Vercel

Back in the Vercel domain settings page, click **Refresh** / **Verify**. Within ~30 seconds it should flip to "Valid Configuration" and Vercel will issue a Let's Encrypt cert for the domain. (Cloudflare also issues its own edge cert independently.)

If Vercel says "Invalid Configuration" for more than a couple minutes:
- Make sure SSL mode in Cloudflare is **Full (strict)** (Step 3) — Flexible breaks this.
- Try toggling the apex A record's proxy OFF (gray cloud) → wait 30 sec → click Verify in Vercel → toggle back to ON. This forces Vercel's verification check to see the real Vercel IP once.

## Step 7 — Set Vercel env vars

Vercel project → Settings → Environment Variables → confirm in **Production** scope:

- `NEXT_PUBLIC_SITE_URL=https://sparclabs.co`

If you change it, redeploy the latest production deployment.

## Step 8 — Resend sending domain (also DNS-driven)

1. <https://resend.com/domains> → **Add Domain** → `sparclabs.co`.
2. Resend gives you 3–4 records:
   - `MX` (for inbound bounces) — e.g. `feedback-smtp.us-east-1.amazonses.com` priority 10
   - `TXT` for SPF on the apex (e.g. `v=spf1 include:amazonses.com ~all`)
   - `TXT` (CNAME-style) for DKIM (e.g. `resend._domainkey` → long key)
   - Optional `TXT` for DMARC on `_dmarc.sparclabs.co`
3. Add each in Cloudflare DNS:
   - **DKIM CNAME and SPF/DMARC TXT records: Proxy = OFF (gray cloud / DNS-only)**. You can't proxy TXT/MX/DKIM — proxy is HTTP/HTTPS only.
4. Wait a few minutes, then click **Verify** in Resend.
5. Once verified, set Vercel env `RESEND_FROM="SPARC Labs <hello@sparclabs.co>"` (Production scope) and redeploy.

## Step 9 — Update Lemon Squeezy webhook URL

<https://app.lemonsqueezy.com/> → Settings → Webhooks → confirm the endpoint is `https://sparclabs.co/api/lemonsqueezy/webhook`. If it's pointing at a Vercel preview URL or an old domain, update it.

## Step 10 — Quick wins to enable in Cloudflare while you're here

These are all 1-toggle, free, and benefit the site immediately:

- **Speed → Optimization → Auto Minify** → check HTML/CSS/JS.
- **Speed → Optimization → Brotli** → ON.
- **Caching → Configuration → Browser Cache TTL** → "Respect Existing Headers" (lets Vercel's headers win).
- **Security → Bots → Bot Fight Mode** → ON. Free; blocks obvious bot traffic before it hits Vercel.
- **Security → Settings → Security Level** → **Medium** (default). Bump to High temporarily if you ever get scraped.
- **Security → WAF → Managed Rules** → leave defaults on.
- **Network → HTTP/3 (with QUIC)** → ON.
- **Network → 0-RTT Connection Resumption** → ON.

---

## Verification checklist

- [ ] `dig NS sparclabs.co` returns the two Cloudflare nameservers.
- [ ] Cloudflare dashboard shows site as "Active."
- [ ] `https://sparclabs.co` loads with valid TLS (and is the SPARC site, not a Vercel error page).
- [ ] `https://www.sparclabs.co` redirects to `https://sparclabs.co` (or vice versa, per your Step 4 choice).
- [ ] Resend dashboard shows `sparclabs.co` as "Verified."
- [ ] Test signup → confirmation email arrives **from `hello@sparclabs.co`**.
- [ ] Test waitlist form → row appears in `public.waitlist` and notification email arrives.
- [ ] Lemon Squeezy webhook URL is `https://sparclabs.co/api/lemonsqueezy/webhook`.

---

## When you're stuck

- **`ERR_TOO_MANY_REDIRECTS`** in browser → SSL/TLS mode is Flexible. Switch to Full (strict).
- **`526 Invalid SSL certificate`** → SSL/TLS mode is Full (strict) but Vercel hasn't issued a cert for the domain yet. Wait 2 min and refresh, or temporarily downgrade to Full (not strict) until Vercel verifies.
- **Vercel says "Invalid Configuration"** for more than 5 min → toggle the apex proxy off (gray cloud) for one verify cycle, then back on.
- **Resend says "Pending"** for >1 hour → check the DKIM CNAME has proxy OFF (gray cloud). Cloudflare can't proxy DKIM.
