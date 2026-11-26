import type { Route } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import "@/components/house/house.css";

const TABS: { key: string; href: string; label: string }[] = [
  { key: "house", href: "/example/account", label: "Your house" },
  { key: "lab", href: "/example/account/lab", label: "What-if lab" },
  { key: "building", href: "/example/account?view=building", label: "While it’s built" },
  { key: "profile", href: "/example/account?view=profile", label: "Profile" },
];

/** The public demo of the paid account, shown with Sample A. */
export function DemoShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main">
        <section className="grid-bg" style={{ borderBottom: "1px solid var(--line)", padding: "28px 0 0" }}>
          <div className="wrap">
            <div className="kicker">The SPARC Labs Field Kit · your account, shown with Sample A</div>
            <h1 style={{ fontSize: "var(--fs-h1)", fontWeight: 800, letterSpacing: "-0.025em", margin: "6px 0 0" }}>
              More than a report: your house, its models and your plan.
            </h1>
            <p style={{ color: "var(--ink-2)", maxWidth: "70ch", margin: "10px 0 0", lineHeight: 1.6 }}>
              After you buy, this is your account. Every finding links to a lab where you try fixes on your own house and see what
              they change. This one is a sample: a real South Street row house, with its address and its map left out.
            </p>
            <nav className="hx-tabs" aria-label="Demo pages" style={{ marginTop: 18, borderBottom: 0 }}>
              {TABS.map((t) => (
                <Link key={t.key} href={t.href as Route} aria-current={t.key === active ? "page" : undefined}>
                  {t.label}
                </Link>
              ))}
            </nav>
          </div>
        </section>
        <section style={{ padding: "28px 0 80px" }}>
          <div className="wrap">{children}</div>
        </section>
      </main>
      <Footer />
    </>
  );
}
