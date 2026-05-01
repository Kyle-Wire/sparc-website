import type { Route } from "next";
import { redirect } from "next/navigation";
import { Nav, Footer } from "@/components/shell/Shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AccountNav } from "./AccountNav";

const NAV: { href: Route; label: string }[] = [
  { href: "/account", label: "Overview" },
  { href: "/account/subscription", label: "Subscription" },
  { href: "/account/seats", label: "Seats" },
  { href: "/account/downloads", label: "Downloads & licenses" },
  { href: "/account/api-keys", label: "API keys (BYOK)" },
  { href: "/account/usage", label: "Usage" },
  { href: "/account/devices", label: "Devices" },
  { href: "/account/settings", label: "Settings" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  return (
    <>
      <Nav />
      <section className="grid-bg" style={{ borderBottom: "1px solid var(--line)", padding: "32px 0 18px" }}>
        <div className="wrap">
          <div className="kicker">account</div>
          <div className="row" style={{ alignItems: "baseline", justifyContent: "space-between", gap: 14 }}>
            <h1 style={{ fontSize: "var(--fs-h1)", fontWeight: 800, letterSpacing: "-0.025em", margin: "6px 0 0", wordBreak: "break-all" }}>{user.email}</h1>
            <form action="/auth/signout" method="post"><button className="btn btn-sm" type="submit">Sign out</button></form>
          </div>
        </div>
      </section>
      <section style={{ padding: "32px 0 80px" }}>
        <div className="wrap account-shell">
          <AccountNav items={NAV} />
          <div style={{ minWidth: 0 }}>{children}</div>
        </div>
      </section>
      <Footer />
    </>
  );
}
