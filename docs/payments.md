# Selling the house report

**22 November 2026.** How a buyer pays for a house report, how it reaches them, and the steps only Kyle can do. Everything here is off on the live site until `CHECKOUT_ENABLED=true` is set in Vercel's Production environment.

## The flow

1. **Pricing → order page.** `/pricing` shows the price and one link to `/report/buy` (only when checkout is on). The page shows what the report includes, what it is not, and the promise, all read from `src/lib/payments/catalog.ts`.
2. **Account.** Ordering needs an account, because the report lives there. `/signup` and `/login` carry the buyer back to the order page.
3. **Order.** The form posts to `POST /api/reports/order`. It writes a `report_orders` row (`awaiting_payment`, the price shown, the address) and redirects to the provider's hosted checkout. Only the row's id travels in the checkout's custom data.
4. **Payment.** The provider calls `POST /api/lemonsqueezy/webhook`. The signature is checked over the raw body; the event goes through `src/lib/payments/webhook.ts` and the SQL function `apply_payment_event` (migration 0007), which moves the order to `paid` once, however many times the event is resent. The buyer gets an email; the inbox (`WAITLIST_NOTIFY_EMAIL`) gets one line with the next command.
5. **Making the report.** A person runs the models in Climate Home Inspection, then:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  RESEND_API_KEY=...
   npx tsx scripts/report-order.ts list
   npx tsx scripts/report-order.ts start <order-id> "optional note the buyer sees"
   npx tsx scripts/report-order.ts deliver <order-id> path/to/report.pdf
   npx tsx scripts/report-order.ts cannot-model <order-id> "why, in words the buyer reads"   # then refund in the dashboard
   ```
6. **Download.** `/account/reports` shows each order's progress. A delivered report downloads through `/api/reports/<id>/download`, which checks the buyer and hands out a five-minute link to the private `reports` bucket.
7. **Refunds** are made in the provider's dashboard. Its `order_refunded` webhook marks the order refunded.

What the code refuses, each with a test: a forged signature (401); a resend (answered 200, nothing changes); a test-mode payment while the store is live; another product's payment; one payment applied to two orders; a refund for a payment that is not the one on record; a payment arriving after a refund; any write from the browser.

## Kyle: set it up in test mode (about 20 minutes)

Lemon Squeezy **closed new store sign-ups on 16 November 2026** and stops processing payments on **31 March 2027** (their post, "Saying goodbye to Lemon Squeezy"). These steps work only if you already have a store. If you do not, skip to the Stripe section.

1. **Supabase.** Apply `supabase/migrations/0007_report_orders.sql` (SQL editor, or `supabase db push` once the migration history is repaired, see `TIER1_HANDOFF.md` A). It creates `report_orders`, `payment_events`, the two functions and the private `reports` bucket. Check in Storage that `reports` exists and is **not public**.
2. **Lemon Squeezy, in Test mode** (toggle at the bottom left of the dashboard):
   - Products → New product: "The house report", single payment, price as decided (the proposal is $149), tax category digital/e-service. Note the **variant id** (the product's variant, in its URL or via the API).
   - Settings → API → new key. Test mode keys are separate from live keys.
   - Settings → Webhooks → add `https://<your preview URL>/api/lemonsqueezy/webhook` (and later `https://sparclabs.co/api/lemonsqueezy/webhook`), events `order_created` and `order_refunded`, and a signing secret: generate one with `openssl rand -hex 20` (Lemon Squeezy allows 6 to 40 characters).
   - Note the **store id** (Settings → Stores).
3. **Vercel → Settings → Environment Variables, Preview environment only:**

   | Name | Value |
   |---|---|
   | `CHECKOUT_ENABLED` | `true` |
   | `PAYMENTS_PROVIDER` | `lemonsqueezy` |
   | `LEMONSQUEEZY_API_KEY` | the test API key |
   | `LEMONSQUEEZY_STORE_ID` | the store id |
   | `LEMONSQUEEZY_VARIANT_REPORT` | the report's variant id |
   | `LEMONSQUEEZY_WEBHOOK_SECRET` | the signing secret |
   | `LEMONSQUEEZY_TEST_MODE` | `true` |
   | `SUPABASE_SERVICE_ROLE_KEY` | already set? check |
   | `RESEND_API_KEY`, `WAITLIST_NOTIFY_EMAIL` | already set? check |

   Never put any of these in the repository: it is public.
4. **Try it.** Open the preview, sign up, order, and pay with Lemon Squeezy's test card `4242 4242 4242 4242`, any future date, any CVC. Expect: the order shows **Paid** with a "test mode" badge in Your reports, and an email in the inbox. Then refund it in the dashboard and expect **Refunded**.

## Before turning it on for real

All of these are Kyle's calls:

- [ ] The price (decision card in the thread, 22 November 2026), set in `catalog.ts` and in the store.
- [ ] The promise: report within 10 working days or a full refund. Change `deliveryDays` if a different number is right.
- [ ] The Terms' report section (`/terms#reports`, shown only when checkout is on) read and agreed. A lawyer's read is recommended.
- [ ] The privacy page's report section, likewise.
- [ ] A live store approved for payments, live keys in Vercel **Production**, `LEMONSQUEEZY_TEST_MODE` unset or `false`. Test-mode orders are then refused as payments.
- [ ] The first live order fulfilled end to end by hand.

## Moving to Stripe (before 31 March 2027)

Lemon Squeezy points sellers to **Stripe Managed Payments**, Stripe's merchant of record, with migration tooling from 2 December 2026. It "isn't a like-for-like replacement" by their own account. The site is built for the switch:

- `src/lib/payments/provider.ts` is the one interface: create a checkout, verify and parse a webhook, recognise the report's product.
- A Stripe adapter is one new file beside `lemonsqueezy.ts`, chosen by `PAYMENTS_PROVIDER=stripe`, plus a webhook route for Stripe's signature header. The order table, the state machine, the pages and the fulfilment script do not change: `report_orders.provider` and `payment_events.provider` already record which provider took each payment.
- The site's Content Security Policy (`next.config.ts`) allows forms to reach `*.lemonsqueezy.com` only; Stripe's checkout host will need adding there.

## What was tested

- `npm test`: the state machine on the migration itself in PGlite, the Lemon Squeezy adapter (signature, parsing, checkout body), the webhook's decisions and the order form.
- The whole flow in a production build against local stand-ins for Supabase (with the real migration in PGlite) and Lemon Squeezy: pricing, sign-up, order, a stand-in checkout that sends a signed webhook, paid, resend answered as duplicate, forged signature refused, `scripts/report-order.ts start` and `deliver`, download of the PDF, a second order refunded. The stand-ins are not committed. **Not tested:** a real Lemon Squeezy test-mode checkout, which needs Kyle's keys.
