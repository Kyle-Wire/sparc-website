import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { paymentProvider } from "@/lib/payments";
import { decide } from "@/lib/payments/webhook";
import { notifyReportEvent } from "@/lib/payments/notify";

export const runtime = "nodejs";

// Stripe's webhook for house report orders. Endpoint:
//   https://sparclabs.co/api/stripe/webhook
// Events: checkout.session.completed, checkout.session.async_payment_succeeded,
// charge.refunded. The signature is checked over the raw body; the event goes
// through src/lib/payments/webhook.ts and apply_payment_event (migration 0007),
// which applies a payment once however often Stripe resends it.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const provider = paymentProvider();
  const event = provider.verifyAndParse(raw, req.headers);
  if (!event) return NextResponse.json({ error: "invalid signature" }, { status: 400 });

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
