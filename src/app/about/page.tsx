import type { Metadata } from "next";
import { withPage } from "@/lib/seo";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section, Kicker } from "@/components/marketing/page-shell";
import { COMPANY, COMPANY_LEGAL, EMAIL_PRIMARY, OFFICE_FULL, FOUNDED_YEAR, OFFICE_CITY, OFFICE_STATE } from "@/lib/brand";

export const metadata: Metadata = withPage("/about", {
  title: "About",
  description: "Who SPARC Labs is and why we put a neighbourhood's flood, heat and ground record in front of home buyers, with our own models labelled by how much evidence stands behind them.",
});

// Rewritten 2026-11-17 for the site's new direction
// (docs/design/site-redesign-brief.md). The page it replaces described a
// causal neural pipeline and a desktop application; both descriptions had
// already been corrected once (30 Oct) because the architecture they asserted
// was retracted in sparc-resilience. None of that text carries over.
//
// Every principle below is a rule the site is built to today, not an
// aspiration: the address handling is in src/lib/place/coords.ts and
// src/app/api/geocode/route.ts, the "no numbers without a run" rule is the
// placeholder register and its CI gates.

const PRINCIPLES = [
  {
    k: "01",
    t: "Public data should be readable.",
    b: "Flood maps, claims records and storm tracks are public, and most people never see them because they do not know where to look or how to read them. Putting them on one page for any address is the free part of this site, and it stays free.",
  },
  {
    k: "02",
    t: "Findings first, the detail right behind.",
    b: "A result leads with what it means. How much stands behind it, its limits and its sources sit one tap away, never hidden and never in the way.",
  },
  {
    k: "03",
    t: "Measured beats modelled, every time.",
    b: "Where an agency or a satellite measured something, we show the measurement and say so. A model result carries its range, and a panel with no run behind it shows no numbers. The build checks that, not our good intentions.",
  },
  {
    k: "04",
    t: "Our methods are open.",
    b: "How each model works, what it was tested against and how it did is written down for anyone who wants it, misses included. You don't have to read it to trust a report, but it is there.",
  },
  {
    k: "05",
    t: "A block, not a house.",
    b: "An address is used to find the place and is then dropped. Pages, links and maps carry the neighbourhood. Only a report someone has asked for is tied to a property, and it stays with them.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Nav active="about" />
      <main id="main">
      <PageHero
        kicker={`about · ${COMPANY.toLowerCase()}`}
        title="Making planning available to everyone."
        lead={`${COMPANY} builds flood, heat, ground and wind models and puts the public record where a home buyer can actually read it. Founded in ${FOUNDED_YEAR} in ${OFFICE_CITY}, ${OFFICE_STATE}. Run by one person.`}
        accent="var(--purple)"
      />

      <Section>
        <div id="thesis" className="split-12-10" style={{ gap: 56, alignItems: "start" }}>
          <div>
            <Kicker>why this exists</Kicker>
            <h2 style={{ fontSize: "var(--fs-display)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1, margin: "12px 0 18px" }}>
              A home is the biggest purchase most people make. The information about its surroundings is public and hard to read.
            </h2>
            <div className="prose">
              <p>
                Engineers and planners have tools for asking where storm water goes and how hot a street
                gets. A buyer mostly has a listing and a flood-zone letter. That gap is lowkey wild, and we
                want to close some of it.
              </p>
              <p>
                The site does two things. It gathers what public agencies already publish about a place and
                shows it plainly, free. And it offers our own models of the neighbourhood around a
                property, so you can see what a hard storm or a hot week looks like there in the model, and
                try out what you could do about it.
              </p>
              <p>
                It&apos;s environmental screening, done properly. It gives you more to go on before you talk to an inspector, an
                engineer or an insurer. It doesn&apos;t replace any of them.
              </p>
            </div>
          </div>
          <div className="card sticky-md-up" style={{ padding: 28, position: "sticky", top: 80 }}>
            <div className="kicker">at a glance</div>
            <dl className="dl" style={{ marginTop: 12 }}>
              <dt>founded</dt><dd className="mono">{FOUNDED_YEAR} · {OFFICE_CITY}, {OFFICE_STATE}</dd>
              <dt>entity</dt><dd className="mono">{COMPANY_LEGAL}</dd>
              <dt>people</dt><dd className="mono">one</dd>
              <dt>free today</dt><dd className="mono">the public record, any US address</dd>
              <dt>paid</dt><dd className="mono">flood, heat, ground and wind models · by invitation</dd>
              <dt>contact</dt><dd className="mono">{EMAIL_PRIMARY}</dd>
            </dl>
          </div>
        </div>
      </Section>

      <Section sunken kicker="principles" title="What the site is built to." id="principles">
        <div className="grid-2" style={{ gap: 18 }}>
          {PRINCIPLES.map((p) => (
            <div key={p.k} className="card" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, padding: 22 }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 3, background: "var(--ink)", color: "#fff", height: "fit-content", letterSpacing: "0.1em" }}>{p.k}</span>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.015em", margin: "0 0 8px" }}>{p.t}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>{p.b}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="get in touch" title="Want a report, or have a question?">
        <div className="row" style={{ gap: 10 }}>
          <Link href="/start" className="btn btn-accent">Ask for a report <span className="arrow">→</span></Link>
          <Link href="/" className="btn">Look up an address</Link>
        </div>
        <p className="mono" style={{ marginTop: 24, fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em" }}>
          {COMPANY_LEGAL} · {OFFICE_FULL}
        </p>
      </Section>

      </main>

      <Footer />
    </>
  );
}
