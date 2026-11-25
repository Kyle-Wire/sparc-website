import type { Route } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkoutEnabled } from "@/lib/payments";
import { ORDER_FIELDS, type HouseOrder } from "@/lib/house/server";
import { share, stepsFor } from "@/lib/house/progress";
import "@/components/house/house.css";

export const dynamic = "force-dynamic";

const LIVE = ["card_saved", "in_progress", "charging", "payment_failed", "delivered"];

// "Your houses": one card per house with a live order or a delivered report.
// A delivered house opens its dashboard and what-if lab; one being built opens
// its tracker. With no house yet, the card points at the demo and the order page.
export default async function AccountOverview() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let houses: HouseOrder[] = [];
  let failed = false;
  try {
    const { data, error } = await supabase.from("report_orders").select(ORDER_FIELDS).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    houses = ((data ?? []) as HouseOrder[]).filter((o) => LIVE.includes(o.status));
  } catch {
    failed = true;
  }
  const onSale = checkoutEnabled();

  return (
    <div className="hx">
      {failed && (
        <p className="journey-error" role="alert">
          We could not load your houses just now. Nothing about them has changed; please refresh in a minute.
        </p>
      )}
      {houses.length > 0 && (
        <div className="hx-hazards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          {houses.map((o) => {
            const ready = o.status === "delivered";
            const pct = Math.round(share(stepsFor(o.status, o.progress)) * 100);
            return (
              <Link
                key={o.id}
                href={`/account/house/${o.id}` as Route}
                className="hx-card hx-hazard"
                style={{ ["--c" as string]: ready ? "var(--wind)" : "var(--flood)", textDecoration: "none", color: "inherit" }}
              >
                <div className="kicker">{ready ? "Ready · open your house" : `Being built · ${pct}%`}</div>
                <h3>{o.address}</h3>
                <p>{ready ? "Findings for every hazard, the what-if lab, your plan and downloads." : "See each model step as it finishes."}</p>
                {!ready && (
                  <div className="hx-meter" aria-hidden>
                    <i style={{ width: `${pct}%` }} />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
      <div className="grid-2" style={{ gap: 14 }}>
        <Link href={(onSale ? "/report/buy" : "/start") as Route} className="card" style={{ padding: 22, textDecoration: "none", color: "inherit" }}>
          <div className="kicker">{houses.length ? "another house" : onSale ? "your first house" : "ask for a report"}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{onSale ? "Order a report" : "Ask us"}</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            {houses.length ? "comparing houses? each gets its own page" : "flood, heat, ground and wind, for one house"}
          </div>
        </Link>
        <Link href={"/example/account" as Route} className="card" style={{ padding: 22, textDecoration: "none", color: "inherit" }}>
          <div className="kicker">what you get</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>Try a sample house</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>the dashboard and what-if lab, with Sample A</div>
        </Link>
      </div>
    </div>
  );
}
