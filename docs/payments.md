# Selling the house report

**22 November 2026.** Kyle's decisions that day: **$149**, and **Stripe Managed Payments only**. How a buyer pays for a house report, how it reaches them, and the steps only Kyle can do. Everything here is off on the live site until `CHECKOUT_ENABLED=true` is set in Vercel's Production environment.

## The flow

1. **Pricing → order page.** `/pricing` shows the price and one link to `/report/buy` (only when checkout is on). The page shows what the report includes, what it is not, and the promise, all read from `src/lib/payments/catalog.ts`.
2. **Account.** Ordering needs an account, because the report lives there. `/signup` and `/login` carry the buyer back to the order page.
3. **Order.** The form posts to `POST /api/reports/order`. It writes a `report_orders` row (`awaiting_payment`, the price shown, the address) and redirects to a Stripe Checkout Session with Managed Payments on. Only the row's id travels with it (`client_reference_id` and metadata).
4. **Payment.** Stripe calls `POST /api/stripe/webhook`. The signature is checked over the raw body; the event goes through `src/lib/payments/webhook.ts` and the SQL function `apply_payment_event` (migration 0007), which moves the order to `paid` once, however many times the event is resent. The buyer gets an email; the inbox (`WAITLIST_NOTIFY_EMAIL`) gets one line with the next command.
5. **Making the report.** A person runs the models in Climate Home Inspection, then:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  RESEND_API_KEY=...
   npx tsx scripts/report-order.ts list
   npx tsx scripts/report-order.ts start <order-id> "optional note the buyer sees"
   npx tsx scripts/report-order.ts deliver <order-id> path/to/report.pdf
   npx tsx scripts/report-order.ts cannot-model <order-id> "why, in words the buyer reads"   # then refund in the dashboard
   ```
6. **Download.** `/account/reports` shows each order's progress. A delivered report downloads through `/api/reports/<id>/download`, which checks the buyer and hands out a five-minute link to the private `reports` bucket.
7. **Refunds** are made in the Stripe Dashboard. Its `charge.refunded` event marks the order refunded (matched on the PaymentIntent). A partial refund is left for a person.

What the code refuses, each with a test: a forged signature (401); a resend (answered 200, nothing changes); a test-mode payment while the store is live; another product's payment; one payment applied to two orders; a refund for a payment that is not the one on record; a payment arriving after a refund; any write from the browser.

## Kyle: set it up in test mode (about 20 minutes)

1. **Supabase.** Apply `supabase/migrations/0007_report_orders.sql` (SQL editor, or `supabase db push` once the migration history is repaired, see `TIER1_HANDOFF.md` A). It creates `report_orders`, `payment_events`, the two functions and the private `reports` bucket. Check in Storage that `reports` exists and is **not public**.
2. **Stripe, in test mode** (the toggle at the top of the Dashboard):
   - Settings → Managed Payments (dashboard.stripe.com/settings/managed-payments): turn it on. Stripe reviews eligibility first. **Read this:** its eligibility page asks for digital products that are "fully automated, with no human intervention". Our report is a digital file but a person makes it, so Stripe may say no. If it does, set `STRIPE_MANAGED_PAYMENTS=false`: the same checkout then runs with Stripe Tax, and SPARC Labs is the seller (you register for and file sales tax where Stripe Tax says you owe it).
   - Product catalogue → Add product: "The house report", one-off price **$149.00 USD**, tax code from the "Eligible for Managed Payments" list (for example `txcd_10000000`, General - Electronically Supplied Services). Copy the **price id** (`price_…`).
   - Developers → API keys: copy the **secret key** (`sk_test_…`).
   - Developers → Webhooks → Add endpoint: `https://<your preview URL>/api/stripe/webhook` (later `https://sparclabs.co/api/stripe/webhook`), API version `2026-04-22.dahlia`, events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`. Copy its **signing secret** (`whsec_…`).
3. **Vercel → Settings → Environment Variables, Preview environment only:**

   | Name | Value |
   |---|---|
   | `CHECKOUT_ENABLED` | `true` |
   | `STRIPE_SECRET_KEY` | the `sk_test_…` key |
   | `STRIPE_PRICE_REPORT` | the `price_…` id |
   | `STRIPE_WEBHOOK_SECRET` | the `whsec_…` secret |
   | `SUPABASE_SERVICE_ROLE_KEY` | already set? check |
   | `RESEND_API_KEY`, `WAITLIST_NOTIFY_EMAIL` | already set? check |

   Never put any of these in the repository: it is public.
4. **Try it.** Open the preview, sign up, order, and pay with Stripe's test card `4242 4242 4242 4242`, any future date, any CVC. Expect: the order shows **Paid** with a "test mode" badge in Your reports, and an email in the inbox. Then refund it in the Dashboard and expect **Refunded**.

## Invitation first (soft launch)

Kyle's decision, 22 November 2026: open by invitation before anyone can order. Once `CHECKOUT_ENABLED=true`, sales are **invitation only by default** (`salesMode()` in `catalog.ts`):

| Variable | Effect |
|---|---|
| `ORDER_INVITE_EMAILS` | Comma-separated emails that may order. Anyone else signed in sees "open by invitation for now" on `/report/buy`, and a hand-made POST to `/api/reports/order` is refused |
| `ORDERS_OPEN=true` | Anyone signed in may order, and the price and Order button appear on `/pricing`. Set only after the soft-launch reports are delivered on time |

During the invitation phase `/pricing` shows no price. Terms, privacy and the FAQ show the report terms as soon as checkout is on, because invited buyers need them.

## Before turning it on for real

All of these are Kyle's calls:

- [x] The price: $149 (22 November 2026).
- [x] The provider: Stripe Managed Payments (22 November 2026).
- [ ] Stripe's Managed Payments eligibility answer, or the Stripe Tax fallback and a sales-tax plan.
- [ ] The promise: report within 10 working days or a full refund. Change `deliveryDays` in `catalog.ts` if a different number is right.
- [ ] The Terms' report section (`/terms#reports`, shown only when checkout is on) read and agreed. A lawyer's read is recommended.
- [ ] The privacy page's report section, likewise.
- [ ] Live keys, live price and a live webhook endpoint in Vercel **Production**. A test-mode event is then refused as a payment, because the key is live.
- [ ] The first live order fulfilled end to end by hand.

## What a buyer sees at checkout

From Stripe's Managed Payments page: the checkout runs through Link, which the buyer sees as the merchant of record ("Sold through Link"); cards, Apple Pay, Google Pay and Link are offered; receipts and refund notices come from Link; the card statement reads `LINK.COM* <our descriptor>`. Link handles buyer support and may contact us, and "if you don't respond within 48 hours, Stripe might issue a refund without your approval". Stripe handles disputes.

## What was tested

- `npm test`: the state machine on the migration itself in PGlite, the Stripe adapter (signature with timestamp tolerance and several v1 values, parsing, the Checkout Session body, form encoding), the webhook's decisions and the order form.
- The whole flow in a production build against local stand-ins for Supabase (with the real migration in PGlite) and Stripe: pricing, sign-up, order, a stand-in checkout that sends a signed `checkout.session.completed`, paid, resend answered as duplicate, forged signature refused, `scripts/report-order.ts start` and `deliver`, download of the PDF, a second order refunded by `charge.refunded` with no order id on the charge. The stand-ins are not committed. **Not tested:** a real Stripe test-mode checkout, which needs Kyle's keys.

Sources opened 22 November 2026 are listed at the top of `src/lib/payments/stripe.ts`.
