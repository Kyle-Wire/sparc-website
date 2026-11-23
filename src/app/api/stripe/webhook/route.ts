import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { paymentProvider } from "@/lib/payments";
import { decide } from "@/lib/payments/webhook";
import { notifyDispute, notifyReportEvent } from "@/lib/payments/notify";

export const runtime = "nodejs";

// Stripe's webhook for house report orders. Endpoint:
//   https://sparclabs.co/api/stripe/webhook
// Events: checkout.session.completed (the card saved at order),
// payment_intent.succeeded (the charge on delivery, or the buyer paying from
// their account), payment_intent.payment_failed, charge.refunded, and
// charge.dispute.created (an alert to the inbox, nothing moves). The
// signature is checked over the raw body; the event goes through
// src/lib/payments/webhook.ts and apply_payment_event (migration 0008), which
// applies each event once however often Stripe resends it.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const provider = paymentProvider();
  const event = provider.verifyAndParse(raw, req.headers);
  if (!event) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

  if (event.eventName === "charge.dispute.created") {
    // Not an order move: tell a person, who answers it in the Dashboard.
    const d = disputeOf(raw);
    if (d) await notifyDispute({ ...d, testMode: event.testMode }).catch((e) => console.warn("[payments] dispute notify failed:", e));
    console.info(`[payments] ${event.eventName} ${event.eventKey} -> dispute_noted`);
    return NextResponse.json({ received: true, outcome: "dispute_noted" }, { status: 200 });
  }

  const admin = createSupabaseAdminClient();
  const d = await decide(event, provider, async ({ provider: p, event: e }) => {
    const { data, error } = await admin.rpc("apply_payment_event", {
      p_provider: p,
      p_event_key: e.eventKey,
      p_event_name: e.eventName,
      p_kind: e.kind,
      p_order_id: e.orderId,
      p_user_id: e.userId,
      p_provider_order_id: e.providerOrderId,
      p_provider_order_number: e.providerOrderNumber,
      p_amount_cents: e.amountCents,
      p_currency: e.currency,
      p_test_mode: e.testMode,
      p_receipt_url: e.receiptUrl,
      p_customer_id: e.customerId ?? null,
      p_setup_id: e.setupId ?? null,
      p_error: e.error ?? null,
    });
    if (error) throw error;
    return String(data);
  });

  console.info(`[payments] ${event.eventName} ${event.eventKey} order=${event.orderId ?? "?"} -> ${d.outcome}`);
  if (d.notify) {
    const orderId = event.orderId ?? (await orderForPayment(admin, event.providerOrderId));
    // Never fail the webhook on an email: the order has already moved.
    if (orderId) await notifyReportEvent(admin, orderId, d.notify).catch((e) => console.warn("[payments] notify failed:", e));
  }
  return NextResponse.json({ received: true, outcome: d.outcome }, { status: d.status });
}

async function orderForPayment(admin: ReturnType<typeof createSupabaseAdminClient>, paymentId: string): Promise<string | null> {
  const { data } = await admin.from("report_orders").select("id").eq("provider", "stripe").eq("provider_order_id", paymentId).maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

/** The fields a person needs from a charge.dispute.created event. */
function disputeOf(raw: string): { id: string; amountCents: number | null; currency: string | null; reason: string | null; dueBy: number | null; paymentId: string | null } | null {
  try {
    const o = JSON.parse(raw)?.data?.object;
    if (!o?.id) return null;
    return {
      id: String(o.id),
      amountCents: typeof o.amount === "number" ? o.amount : null,
      currency: o.currency ? String(o.currency) : null,
      reason: o.reason ? String(o.reason) : null,
      dueBy: typeof o.evidence_details?.due_by === "number" ? o.evidence_details.due_by : null,
      paymentId: o.payment_intent ? String(typeof o.payment_intent === "object" ? o.payment_intent.id : o.payment_intent) : null,
    };
  } catch {
    return null;
  }
}
