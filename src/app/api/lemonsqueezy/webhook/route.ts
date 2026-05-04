import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { verifyWebhookSignature, type LemonSqueezyEvent } from "@/lib/lemonsqueezy";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";

interface LSWebhook {
  meta: {
    event_name: LemonSqueezyEvent;
    custom_data?: { user_id?: string; tier?: string };
  };
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown> & {
      user_email?: string;
      status?: string;
      product_id?: number;
      variant_id?: number;
      customer_id?: number;
      renews_at?: string | null;
      ends_at?: string | null;
      trial_ends_at?: string | null;
      cancelled?: boolean;
      urls?: { customer_portal?: string };
    };
  };
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature");
  if (!verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: LSWebhook;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const event = payload.meta.event_name;
  const userId = payload.meta.custom_data?.user_id;
  const tier = payload.meta.custom_data?.tier;
  const attr = payload.data.attributes;

  if (!userId) {
    // Order without user_id (e.g. one-off) — log but ack so LS doesn't retry forever.
    console.warn("[lemonsqueezy] event without user_id:", event);
    return NextResponse.json({ ok: true });
  }

  const admin = createSupabaseAdminClient();

  // Idempotency: short-circuit replays. Table created in migration 0004.
  // Use the LS event id header (set per delivery) as the dedup key.
  const eventId = req.headers.get("x-event-id") ?? `${event}:${payload.data.id}`;
  try {
    const { error: dupErr } = await admin
      .from("lemonsqueezy_events")
      .insert({ event_id: eventId, event_name: event });
    if (dupErr) {
      // 23505 = unique_violation → we've seen this delivery before.
      const code = (dupErr as { code?: string }).code;
      if (code === "23505") {
        return NextResponse.json({ ok: true, deduped: true });
      }
      // Table may not exist yet (migration not applied) — log and continue.
      console.warn("[lemonsqueezy] dedup insert failed (continuing):", dupErr);
    }
  } catch (err) {
    console.warn("[lemonsqueezy] dedup check error (continuing):", err);
  }

  try {
    if (event.startsWith("subscription_")) {
      const status = attr.status ?? (event === "subscription_cancelled" ? "cancelled" : event === "subscription_expired" ? "expired" : "active");
      await admin.from("subscriptions").upsert({
        user_id: userId,
        tier: tier ?? null,
        ls_subscription_id: payload.data.id,
        ls_customer_id: attr.customer_id ?? null,
        ls_product_id: attr.product_id ?? null,
        ls_variant_id: attr.variant_id ?? null,
        status,
        renews_at: attr.renews_at ?? null,
        ends_at: attr.ends_at ?? null,
        trial_ends_at: attr.trial_ends_at ?? null,
        customer_portal_url: attr.urls?.customer_portal ?? null,
        raw: attr,
        updated_at: new Date().toISOString(),
      }, { onConflict: "ls_subscription_id" });

      // Transactional emails — fire-and-forget so a Resend hiccup never fails the webhook.
      void notifySubscription(admin, event, userId, tier ?? null, attr).catch((e) =>
        console.warn("[lemonsqueezy] email notify failed:", e),
      );
    } else if (event === "order_created") {
      await admin.from("orders").upsert({
        user_id: userId,
        ls_order_id: payload.data.id,
        tier: tier ?? null,
        raw: attr,
        created_at: new Date().toISOString(),
      }, { onConflict: "ls_order_id" });
    } else if (event === "order_refunded") {
      await admin.from("orders").update({ refunded_at: new Date().toISOString(), raw: attr }).eq("ls_order_id", payload.data.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[lemonsqueezy] persist failed:", event, err);
    return NextResponse.json({ error: "persist failed" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers

type SubAttr = LSWebhook["data"]["attributes"];

function formatDate(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatPlan(tier: string | null, attr: SubAttr): string {
  const productName = (attr as { product_name?: string }).product_name;
  const variantName = (attr as { variant_name?: string }).variant_name;
  if (productName && variantName) return `${productName} (${variantName})`;
  if (productName) return productName;
  if (tier) return tier.charAt(0).toUpperCase() + tier.slice(1);
  return "SPARC";
}

async function resolveUserEmail(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  attr: SubAttr,
): Promise<{ email: string; firstName?: string } | null> {
  // Prefer the email on the LS payload; fall back to Supabase auth lookup.
  let email = attr.user_email ?? null;
  let firstName: string | undefined;
  try {
    const { data } = await admin.auth.admin.getUserById(userId);
    if (data?.user) {
      email = email ?? data.user.email ?? null;
      const meta = (data.user.user_metadata ?? {}) as { full_name?: string; name?: string };
      const fullName = meta.full_name ?? meta.name;
      if (fullName) firstName = fullName.split(" ")[0];
    }
  } catch {
    // Non-fatal — we may still have an email from the LS payload.
  }
  if (!email) return null;
  return { email, firstName };
}

async function notifySubscription(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  event: LemonSqueezyEvent,
  userId: string,
  tier: string | null,
  attr: SubAttr,
) {
  if (event !== "subscription_created" && event !== "subscription_cancelled") return;
  const recipient = await resolveUserEmail(admin, userId, attr);
  if (!recipient) return;

  const planName = formatPlan(tier, attr);

  if (event === "subscription_created") {
    const renewsOn = formatDate(attr.renews_at);
    await sendEmail({
      to: recipient.email,
      template: "subscription-receipt",
      props: {
        firstName: recipient.firstName,
        planName,
        amount:
          (attr as { total_formatted?: string; subtotal_formatted?: string })
            .total_formatted ??
          (attr as { subtotal_formatted?: string }).subtotal_formatted ??
          "—",
        currency: (attr as { currency?: string }).currency ?? "USD",
        nextBillingDate: renewsOn,
        invoiceUrl: (attr.urls as { invoice_url?: string } | undefined)?.invoice_url,
        manageUrl: attr.urls?.customer_portal,
      },
    });
    return;
  }

  // subscription_cancelled
  const endsOn = formatDate(attr.ends_at) ?? formatDate(attr.renews_at) ?? "the end of your billing period";
  await sendEmail({
    to: recipient.email,
    template: "subscription-canceled",
    props: {
      firstName: recipient.firstName,
      planName,
      endsOn,
      reactivateUrl: attr.urls?.customer_portal,
    },
  });
}
