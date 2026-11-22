import type { Route } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkoutEnabled } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function AccountOverview() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let counts = { open: 0, ready: 0 };
  try {
    const { data } = await supabase.from("report_orders").select("status").limit(200);
    for (const o of data ?? []) {
      if (o.status === "delivered") counts.ready++;
      else if (o.status === "paid" || o.status === "in_progress") counts.open++;
    }
  } catch {
    counts = { open: 0, ready: 0 };
  }
  const onSale = checkoutEnabled();

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="card" style={{ padding: 24 }}>
        <div className="kicker">welcome</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "8px 0 0" }}>
          {user.user_metadata?.full_name || user.email}
        </h2>
        <p style={{ color: "var(--ink-2)", margin: "8px 0 0", fontSize: 14, lineHeight: 1.6 }}>
          Your house reports live here. The public record for any place stays free, with or without an account.
        </p>
      </div>

      <div className="grid-2" style={{ gap: 14 }}>
        <Link href="/account/reports" className="card" style={{ padding: 22, textDecoration: "none", color: "inherit" }}>
          <div className="kicker">your reports</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>
            {counts.ready ? `${counts.ready} ready` : counts.open ? `${counts.open} on the way` : "None yet"}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            {counts.ready && counts.open ? `${counts.open} more on the way` : "orders, progress and downloads"}
          </div>
        </Link>
        <Link href={(onSale ? "/report/buy" : "/start") as Route} className="card" style={{ padding: 22, textDecoration: "none", color: "inherit" }}>
          <div className="kicker">{onSale ? "a new report" : "ask for a report"}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{onSale ? "Order one" : "Ask us"}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>flood and heat, for one house</div>
        </Link>
      </div>
    </div>
  );
}
