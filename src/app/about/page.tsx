import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section, Kicker } from "@/components/marketing/page-shell";
import { COMPANY, COMPANY_LEGAL, EMAIL_PRIMARY, OFFICE_FULL, FOUNDED_YEAR, OFFICE_CITY, OFFICE_STATE, VERSION, BRAND_LONG } from "@/lib/brand";

// Corrected 2026-10-30. Three claims on this page asserted the architecture
// that was retracted in sparc-resilience, and one principle asserted a property
// the company's own figure of record does not have.
//
//   "a working desktop application built around a single neural pipeline"
//   "The model is neural. The structure is causal."
//     The SharedTrunk + CityHead stacker never ran. It raised an
//     UnboundLocalError before its first epoch and the pipeline fell back to a
//     weighted average of the base models, which is what produced every figure
//     of record. The desktop application is frozen and has never been built for
//     release. See docs/results/reconciliation.md in the engine repository.
//
//   principle 02, "a result can be regenerated from the project file that
//   produced it"
//     The Providence run of record cannot be regenerated: the run directory was
//     not kept, and the company accepted that deliberately rather than pay to
//     reproduce it. The flood and wind benchmark results are not pinned to the
//     commits that produced them either. Retaining the run directory is the
//     rule for future runs of record, which is a commitment and not an existing
//     property.
//
//   principle 04, "We sell software, not your work"
//     Nothing is for sale. Self-serve checkout was disabled on 29 Oct.
//
// The "runtime" row named Tauri, which is the delivery path being retired.

export default function AboutPage() {
  return (
    <>
      <Nav active="about" />
      <PageHero
        kicker={`about · ${COMPANY.toLowerCase()}`}
        title="A research lab dressed like a research lab."
        lead={`We make tools for the people who actually have to be right — climate scientists, civil consultants, urban planners, and the grad students doing most of the work. Founded in ${FOUNDED_YEAR} in ${OFFICE_CITY}, ${OFFICE_STATE}.`}
        accent="var(--purple)"
      />

      <Section>
        <div id="thesis" className="split-12-10" style={{ gap: 56, alignItems: "start" }}>
          <div>
            <Kicker>our thesis</Kicker>
            <h2 style={{ fontSize: "var(--fs-display)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1, margin: "12px 0 18px" }}>Spatial science deserves better instruments.</h2>
            <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 14 }}>
              Most spatial ML tools today are either too academic to ship or too commercial to trust. The first ones don&apos;t have install scripts. The second ones don&apos;t tell you what their models actually optimize.
            </p>
            <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 14 }}>
              We started {COMPANY} — SPARC for {BRAND_LONG} — to make a third thing: hazard models that take the rigour of academic geostatistics seriously and are built to be handed to someone else, with the engineering hygiene that implies.
            </p>
            <p style={{ fontSize: 16, color: "var(--ink-2)", lineHeight: 1.65, marginBottom: 0 }}>
              The structure is causal. The physics is explicit. And the part we care most about: when a result does not hold up, we publish that too — the methodology reports carry the failures alongside the passes, because a model you cannot check is not evidence.
            </p>
          </div>
          <div className="card sticky-md-up" style={{ padding: 28, position: "sticky", top: 80 }}>
            <div className="kicker">at a glance</div>
            <dl className="dl" style={{ marginTop: 12 }}>
              <dt>founded</dt><dd className="mono">{FOUNDED_YEAR} · {OFFICE_CITY}, {OFFICE_STATE}</dd>
              <dt>entity</dt><dd className="mono">{COMPANY_LEGAL}</dd>
              <dt>stage</dt><dd className="mono">pre-release · {VERSION}</dd>
              <dt>license</dt><dd className="mono">proprietary · {COMPANY_LEGAL}</dd>
              <dt>runtime</dt><dd className="mono">local · Python · React</dd>
              <dt>compute</dt><dd className="mono">on your machine · GPU or CPU</dd>
              <dt>contact</dt><dd className="mono">{EMAIL_PRIMARY}</dd>
            </dl>
          </div>
        </div>
      </Section>

      <Section sunken kicker="principles · 04" title="What we'll never compromise on." id="principles">
        <div className="grid-2" style={{ gap: 18 }}>
          {[
            { k: "01", t: "Models that show their work.", b: "If you can't see the numbers, question the assumptions, or trace every step — it isn't science. It's marketing." },
            { k: "02", t: "A result names the run behind it.", b: "Every figure we publish names the run, the configuration and the file it came from, including the ones that failed. Where an earlier result cannot be regenerated, we say so instead of implying otherwise — and from now on a run of record keeps its run directory." },
            { k: "03", t: "Physics is a feature.", b: "Physical laws, conservation rules, effect directions — these aren't limitations, they're what make the model trustworthy." },
            { k: "04", t: "Your data stays yours.", b: "The models are built to run on your machine, so municipal data never has to be uploaded to us. If instead we run a study for you, your inputs do come to us — and the handling terms go in the agreement, in writing." },
          ].map((p, i) => (
            <div key={i} className="card" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, padding: 22 }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 3, background: "var(--ink)", color: "#fff", height: "fit-content", letterSpacing: "0.1em" }}>{p.k}</span>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 8px" }}>{p.t}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>{p.b}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="get in touch" title="Want to talk?">
        <div className="grid-2" style={{ gap: 18 }}>
          <div className="card" style={{ padding: 28, borderLeft: "3px solid var(--crimson)" }}>
            <div className="kicker">researchers · early access</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: "10px 0 10px" }}>Join the research pilot.</h3>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 16px" }}>
              Tell us your spatial question and we&apos;ll scope a pilot together. You bring the data and scenarios — we produce outputs, confidence intervals, and a report built for your audience, with the limits stated alongside.
            </p>
            <Link href="/demo" className="btn btn-accent">Apply for access <span className="arrow">→</span></Link>
          </div>
          <div className="card" style={{ padding: 28, borderLeft: "3px solid var(--purple)" }}>
            <div className="kicker">planning agencies · research groups</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, margin: "10px 0 10px" }}>Bring a real planning question.</h3>
            <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 16px" }}>
              We want to work with city agencies, infrastructure teams and academic groups on pilots designed around active decisions — zoning, capital investment, adaptation strategy.
            </p>
            <Link href="/demo" className="btn">Start the conversation <span className="arrow">→</span></Link>
          </div>
        </div>
        <p className="mono" style={{ marginTop: 24, fontSize: 11, color: "var(--muted)", textAlign: "center", letterSpacing: "0.1em" }}>
          {COMPANY_LEGAL} · {OFFICE_FULL} · {BRAND_LONG.toLowerCase()}
        </p>
      </Section>

      <Footer />
    </>
  );
}
