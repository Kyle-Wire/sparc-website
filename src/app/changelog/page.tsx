import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { VERSION } from "@/lib/brand";

export const metadata = { title: "Changelog" };

// The v0.5.0 entries are kept rather than deleted: this page is a dated record of
// what was built, and quietly rewriting it to hide four features would be the exact
// opposite of the "no rewrites" it claims. What the entries are not is a list of
// things that work, so the withdrawal note is mandatory alongside them.
//
// Do not remove the note without also removing the entries, and do not add an entry
// for a capability that is frozen or unenforced without one.
const RELEASES = [
  {
    v: VERSION,
    d: "2026-01",
    notes: ["Lemon Squeezy billing integration", "Supabase auth + account portal", "Per-seat license keys", "BYOK API key vault"],
    withdrawn:
      "None of the four items in this release is in service. Self-serve billing is disabled and nothing on this site is for sale. " +
      "There is no entitlement enforcement anywhere in the product, so per-seat license keys grant and withhold nothing. " +
      "The BYOK key vault was wired to a model identifier that has never existed, so that path has never worked for anyone. " +
      "These entries stay because this is a record of what was built, not of what works.",
  },
  { v: "v0.4.0", d: "2025-11", notes: ["Scenario engine v4", "Phase C7 dual-write artifact store", "Memory watchdog", "Bayesian beta simulator"] },
  { v: "v0.3.0", d: "2025-08", notes: ["Causal stack", "NUTS per-edge sampling", "Stage 4 migration"] },
];

export default function ChangelogPage() {
  return (
    <>
      <Nav />
      <PageHero kicker="changelog" title="What's shipped." lead="Honest, dated, no rewrites." accent="var(--magenta)" />
      <Section>
        <div style={{ display: "grid", gap: 18 }}>
          {RELEASES.map((r) => (
            <div key={r.v} className="card" style={{ padding: 24 }}>
              <div className="row" style={{ alignItems: "baseline", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>{r.v}</h3>
                <span className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>{r.d}</span>
              </div>
              <ul style={{ marginTop: 12, paddingLeft: 18, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.65 }}>
                {r.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
              {"withdrawn" in r && r.withdrawn ? (
                <p
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    /* --rule, not --hairline. This rule separates a release's
                       notes from the statement that the release was withdrawn,
                       which is "the division between a result and the caveat on
                       it" -- §5.2's structural phrase, literally. A reader who
                       cannot find this line reads the retraction as one more
                       bullet. */
                    borderTop: "1px solid var(--rule)",
                    color: "var(--ink-2)",
                    fontSize: 13,
                    lineHeight: 1.7,
                  }}
                >
                  <strong style={{ color: "var(--ink)" }}>Not in service.</strong> {r.withdrawn}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Section>
      <Footer />
    </>
  );
}
