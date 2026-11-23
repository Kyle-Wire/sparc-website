# Selling the house report

**22 November 2026.** Kyle's decisions that day: **$149**; **Stripe**; and the buyer is **charged when the report is ready**, not when they order. How a buyer orders and pays for a house report, how it reaches them, and the steps only Kyle can do. Everything here is off on the live site until `CHECKOUT_ENABLED=true` is set in Vercel's Production environment.

## Why not Managed Payments (or Paddle, or Polar)

Stripe Managed Payments' eligibility page says: "If your service involves human intervention (such as live 1-1 coaching), it doesn't qualify", and lists "Professional services, such as consulting" as unsupported. Our report is made by a person. Paddle bans "Human services that are not related to a software offering"; Polar lists "Human services" as prohibited. So no merchant-of-record service fits, and **SPARC Labs is the seller**: Stripe Tax works out and collects sales tax, and Kyle registers and files where Stripe Tax says we owe. (Managed Payments also takes only payment or subscription sessions, so it could not save a card for later anyway.) The comparison, with sources, is the "House report: payment options if Stripe says no" doc from the payments thread.

## The flow

1. **Pricing → order page.** `/pricing` shows the price and one link to `/report/buy` (only when checkout is on and orders are open). The page shows what the report includes, what it is not, and the promise, all read from `src/lib/payments/catalog.ts`.
2. **Account.** Ordering needs an account, because the report lives there. `/signup` and `/login` carry the buyer back to the order page.
3. **Order: save a card, charge nothing.** The form posts to `POST /api/reports/order`. It writes a `report_orders` row (`awaiting_card`, the price shown, the address), makes a Stripe Customer for the order, and redirects to a Checkout Session in **setup mode** (billing address required, for tax). Only the row's id travels with it.
4. **Card saved.** Stripe sends `checkout.session.completed` (mode `setup`) to `POST /api/stripe/webhook`. The signature is checked over the raw body; `src/lib/payments/webhook.ts` and the SQL function `apply_payment_event` (migration 0008) move the order to `card_saved` once, however often the event is resent, and record the Customer and SetupIntent. The buyer gets "your report is ordered, nothing has been charged"; the inbox gets one line with the next command.
5. **Making the report.** A person runs the models in Climate Home Inspection (see `report-ops.md`), then:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  RESEND_API_KEY=...
   export STRIPE_SECRET_KEY=...  STRIPE_PRICE_REPORT=...
   npx tsx scripts/report-order.ts list
   npx tsx scripts/report-order.ts start <order-id> "optional note the buyer sees"
   npx tsx scripts/report-order.ts deliver <order-id> path/to/report.pdf
   npx tsx scripts/report-order.ts cannot-model <order-id> "why, in words the buyer reads"   # charges nothing, removes the card
   npx tsx scripts/report-order.ts cancel <order-id> "note"                                  # the buyer asked; charges nothing
   ```
6. **Deliver = upload, then charge.** `deliver` uploads the PDF to the private `reports` bucket (locked), moves the order to `charging`, then:
   - checks that Stripe's Price for `STRIPE_PRICE_REPORT` is the catalogue's $149 (it refuses to charge otherwise);
   - works out sales tax with a Stripe Tax Calculation from the saved card's billing address and the product's tax code;
   - charges the saved card off-session for the total (`hooks[inputs][tax][calculation]`, so Stripe records the tax transaction), with an idempotency key per order and try, so a rerun never charges twice.
   On success the order is `delivered`, the download unlocks and the buyer gets "your report is ready, we charged $X" with the receipt. On a decline it is `payment_failed`: the buyer gets the bank's reason and a **Pay and open the report** button in their account (`POST /api/reports/<id>/pay`, a normal Checkout page with Stripe Tax). Their payment arrives as `payment_intent.succeeded` and unlocks the report. Running `deliver` again also retries the card.
7. **Download.** `/account/reports` shows each order's progress (Ordered, Being modelled, Paid and ready). Only a paid order downloads, through `/api/reports/<id>/download`, which checks the buyer and hands out a five-minute link.
8. **Refunds** are made in the Stripe Dashboard. Its `charge.refunded` event marks the order refunded (matched on the PaymentIntent). A partial refund is left for a person.

What the code refuses, each with a test: a forged or stale signature (400); a resend (answered 200, nothing changes); a test-mode event while the keys are live; another product; one payment applied to two orders; a payment before the report is ready (flagged, nothing unlocks); a payment after a cancel; a refund for a payment that is not the one on record; marking an order delivered by hand; charging when Stripe's price differs from the price shown; any write from the browser.

## Kyle: set it up in test mode (about 25 minutes)

1. **Supabase.** Apply `supabase/migrations/0007_report_orders.sql`, then `0008_charge_on_delivery.sql`, then `0009_order_agreement_and_deadline.sql` (SQL editor, or `supabase db push` once the migration history is repaired, see `TIER1_HANDOFF.md` A). Check in Storage that `reports` exists and is **not public**.
2. **Stripe, in test mode** (the toggle at the top of the Dashboard):
   - **Tax:** Settings → Tax: add the business address (head office) and turn Stripe Tax on. Registrations come later, with an accountant; until we register somewhere, Stripe Tax calculates no tax there.
   - **Product catalogue → Add product:** "The house report", one-off price **$149.00 USD**, and a tax code. Ask the accountant which code fits a hand-made report delivered as a PDF; `txcd_10000000` (General - Electronically Supplied Services) is Stripe's general one. Copy the **price id** (`price_…`).
   - **Developers → API keys:** copy the **secret key** (`sk_test_…`).
   - **Developers → Webhooks → Add endpoint:** `https://<your preview URL>/api/stripe/webhook` (later `https://sparclabs.co/api/stripe/webhook`), API version `2026-04-22.dahlia`, events `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `charge.dispute.created`. Copy its **signing secret** (`whsec_…`).
3. **Vercel → Settings → Environment Variables, Preview environment only:**

   | Name | Value |
   |---|---|
   | `CHECKOUT_ENABLED` | `true` |
   | `ORDER_INVITE_EMAILS` | your own email, to try it |
   | `STRIPE_SECRET_KEY` | the `sk_test_…` key |
   | `STRIPE_PRICE_REPORT` | the `price_…` id |
   | `STRIPE_WEBHOOK_SECRET` | the `whsec_…` secret |
   | `SUPABASE_SERVICE_ROLE_KEY` | already set? check |
   | `RESEND_API_KEY`, `WAITLIST_NOTIFY_EMAIL` | already set? check |

   Never put any of these in the repository: it is public. `STRIPE_MANAGED_PAYMENTS` is no longer read; delete it if you set it.
4. **Try it.** Open the preview, sign up, order, and save Stripe's test card `4242 4242 4242 4242` (any future date, any CVC, a US postcode). Expect **Ordered** with a "test mode" badge and nothing charged. Then from your machine, with the same test keys: `start`, then `deliver` with any PDF. Expect **Paid and ready**, a download, and a charge of $149 plus tax in the Dashboard. To try a decline, order again with the card Stripe's testing page (docs.stripe.com/testing) lists as attaching to a customer but failing when charged (`4000 0000 0000 0341` as we remember it; check the page), `deliver`, then pay from the account with `4242…`.

## Invitation first (soft launch)

Kyle's decision, 22 November 2026: open by invitation before anyone can order. Once `CHECKOUT_ENABLED=true`, sales are **invitation only by default** (`salesMode()` in `catalog.ts`):

| Variable | Effect |
|---|---|
| `ORDER_INVITE_EMAILS` | Comma-separated emails that may order. Anyone else signed in sees "open by invitation for now" on `/report/buy`, and a hand-made POST to `/api/reports/order` is refused |
| `ORDERS_OPEN=true` | Anyone signed in may order, and the price and Order button appear on `/pricing`. Set only after the soft-launch reports are delivered on time |
| `ORDERS_WEEKLY_CAP` | Optional. The most orders taken in any seven days (orders a card was saved for, or later). At the cap, `/report/buy` says "not this week" and asks the buyer to write, before any card is saved. Unset means no cap. Suggested: `3` while one person reads every report |

During the invitation phase `/pricing` shows no price. Terms, privacy and the FAQ show the report terms as soon as checkout is on, because invited buyers need them.

## Before turning it on for real

All of these are Kyle's calls:

- [x] The price: $149 (22 November 2026).
- [x] The provider: Stripe, SPARC Labs as the seller (22 November 2026).
- [x] When the buyer pays: when the report is ready (22 November 2026).
- [ ] A sales-tax plan with an accountant: where to register, and the product's tax code.
- [ ] The promise: report within 10 working days of the order, or the buyer may cancel and pays nothing. Change `deliveryDays` in `catalog.ts` if a different number is right.
- [ ] The Terms' report section (`/terms#reports`, shown only when checkout is on) read and agreed, including the saved-card authorisation (when we charge, how much). A lawyer's read is recommended.
- [ ] The privacy page's report section, likewise.
- [ ] Live keys, live price, Stripe Tax on, and a live webhook endpoint in Vercel **Production**. A test-mode event is then refused, because the key is live.
- [ ] The first live order fulfilled end to end by hand.

## What a buyer sees

At order: Stripe's Checkout page saying the card is saved, not charged, with a billing address. When the report is ready: an email from us with the amount charged and Stripe's receipt. The card statement shows SPARC Labs' statement descriptor (set in Stripe's public details). If the card fails: an email with the bank's reason and a link to pay in their account. Disputes and refunds come to us, through the Stripe Dashboard.

## What was tested

- `npm test`: the state machine on migrations 0007 and 0008 in PGlite (21 cases), the Stripe adapter (signatures, parsing of each event, the setup and pay-link session bodies, the off-session charge with its tax calculation and idempotency key, declines, a bank asking to authenticate, a price mismatch, a card with no billing address, removing the card), the webhook's decisions and the order form.
- The whole flow in a production build against local stand-ins for Supabase (with the real migrations in PGlite) and Stripe: pricing, sign-up, order, a stand-in setup checkout that sends a signed `checkout.session.completed`, the same event resent (duplicate), a forged and a stale signature (400), download refused before payment (404), `start`, `deliver` (tax calculated, card charged, report unlocked, the webhook's copy of the payment a duplicate), download (200, PDF), `deliver` rerun (refused, nothing charged, file untouched), a second order whose card is declined at delivery (download still 404), then paid from the account, a third order cancelled (card removed), and a refund. Phone width 390 with no sideways scroll. The stand-ins are not committed. **Not tested:** real Stripe test mode, which needs Kyle's keys. Two details the docs did not settle are checked there first: that `billing_address_collection` is accepted in setup mode, and that `hooks[inputs][tax][calculation]` works on an off-session PaymentIntent.

**23 November 2026, in Stripe test mode** (account `acct_1UeQhBEDY8ZHJfbJ`): a setup-mode Checkout Session with `billing_address_collection=required` is accepted (HTTP 200). Without `payment_method_types`, that page offered card, Klarna, Link, Cash App Pay and Amazon Pay, which the off-session charge at delivery cannot rely on, so the setup session now asks for cards only (`payment_method_types=[card]`, also accepted). The setup page also states the charge above the Save button (`custom_text`), and the SetupIntent carries the order's metadata. The tax hook on an off-session PaymentIntent waits for Stripe Tax to be active (it needs the head office address). The test product is `prod_VgPMbgxGEnPPMx`, the $149 price `price_1Uf2Y1EDY8ZHJfbJBDpqz3Fp`, and the webhook endpoint `we_1Uf2Y1EDY8ZHJfbJ71i1UPgf` points at the `claude/stripe-test` branch preview with five events: the four above plus `charge.dispute.created`, which emails the inbox (`WAITLIST_NOTIFY_EMAIL`) with the evidence deadline and changes no order. Vercel previews sit behind Vercel login, so that endpoint's URL needs the project's Protection Bypass for Automation secret as `?x-vercel-protection-bypass=<secret>`.

Sources opened 22 November 2026 are listed at the top of `src/lib/payments/stripe.ts`.
