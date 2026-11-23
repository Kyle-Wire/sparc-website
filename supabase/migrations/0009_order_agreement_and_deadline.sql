-- What the buyer agreed to, and when they need the report.
--
-- Blind-spots review, 23 November 2026:
--   * /report/buy has required a tick ("I have read what the report is and
--     is not...") since migration 0007, but nothing stored it. If a buyer
--     disputes the charge, the record of what they agreed to and when is our
--     main evidence. terms_version is REPORT_TERMS_VERSION from
--     src/lib/payments/catalog.ts at the moment of the order.
--   * The promise is 10 working days, and many buyers' inspection periods are
--     10 calendar days (the Pennsylvania standard form's default). The order
--     form now asks for the deadline, and if it comes before the promise the
--     buyer must say they understand before a card is saved.
--
-- Orders made before this migration keep nulls: none was a real order
-- (checkout has never been switched on in Production).

alter table public.report_orders
  add column if not exists terms_version text,
  add column if not exists agreed_at timestamptz,
  add column if not exists inspection_deadline date,
  add column if not exists deadline_acknowledged boolean not null default false;

-- The runner works earliest deadline first (scripts/report-order.ts list).
create index if not exists report_orders_deadline_idx on public.report_orders (status, inspection_deadline);
