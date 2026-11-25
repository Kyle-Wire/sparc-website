import type { Metadata } from "next";
import { withPage } from "@/lib/seo";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section, Kicker } from "@/components/marketing/page-shell";
import { COMPANY, COMPANY_LEGAL, EMAIL_PRIMARY, OFFICE_FULL, FOUNDED_YEAR, OFFICE_CITY, OFFICE_STATE } from "@/lib/brand";

export const metadata: Metadata = withPage("/about", {
  title: "About",
  description: "Why SPARC Labs exists: a founder who lived through Hurricane Sandy on the New Jersey coast, and a mission to give every home buyer the tools and knowledge to decide well.",
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

// The founder's story (Kyle, 25 Nov 2026): Sandy on the New Jersey coast,
// the house fire, three weeks without power; an environmental planner (BS
// environmental science, MS sustainable urban environments, five years on
// climate adaptation infrastructure); the mission to protect neighbours and
// to balance people and nature. No town and no name, at Kyle's ask.
function StoryArt() {
  return (
    <svg viewBox="0 0 480 260" role="img" aria-label="Illustration: on the left, a coastal house in a storm at night; on the right, the same house in daylight on a map, its surroundings understood." className="model-art">
      <title>From the storm to the map</title>
      <rect width="240" height="260" fill="#1d2433" />
      <rect x="240" width="240" height="260" fill="#eef3f6" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <line key={i} x1={20 + i * 24} y1={20 + (i % 3) * 14} x2={10 + i * 24} y2={48 + (i % 3) * 14} stroke="#7fa4c4" strokeWidth="2" strokeLinecap="round" />
      ))}
      <path d="M0 210 C 40 196 70 222 110 206 C 150 192 180 220 240 204 L240 260 L0 260 Z" fill="#2f5a78" />
      <g transform="translate(130 196)">
        <rect x="-30" y="-44" width="60" height="44" fill="#3a3f4a" stroke="#0e1118" />
        <path d="M-36 -44 L0 -72 L36 -44 Z" fill="#23262e" />
        <rect x="-8" y="-30" width="14" height="14" fill="#f2a516" opacity="0.85" />
      </g>
      <path d="M40 120 L 60 196" stroke="#9aa4b0" strokeWidth="3" />
      <path d="M60 120 L 92 150" stroke="#9aa4b0" strokeWidth="2" strokeDasharray="4 4" />
      <g stroke="#c9d6de" strokeWidth="1">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`v${i}`} x1={260 + i * 40} y1="10" x2={260 + i * 40} y2="250" />
        ))}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line key={`h${i}`} x1="250" y1={30 + i * 40} x2="470" y2={30 + i * 40} />
        ))}
      </g>
      <path d="M250 200 C 320 180 360 214 470 190 L470 250 L250 250 Z" fill="#0b6a88" opacity="0.35" />
      <rect x="330" y="96" width="44" height="36" fill="#f3efe6" stroke="#2a2a2a" strokeWidth="1.5" />
      <path d="M326 96 L352 76 L378 96 Z" fill="#3b3b3a" />
      <path d="M352 150 l -8 -14 h16 Z" fill="#b3122e" />
      <circle cx="430" cy="44" r="16" fill="#f2a516" />
      <text x="120" y="244" textAnchor="middle" className="ma-label ma-label-paper">The storm</text>
      <text x="360" y="244" textAnchor="middle" className="ma-label">Knowing the place</text>
    </svg>
  );
}

export default function AboutPage() {
  return (
    <>
      <Nav active="about" />
      <main id="main">
      <PageHero
        kicker={`about · ${COMPANY.toLowerCase()}`}
        title="Built by a neighbour who has seen what nature can do."
        lead={`${COMPANY} is a small environmental science company in ${OFFICE_CITY}, ${OFFICE_STATE}. We build our own models of flood, heat, ground, wind and fire, and put what they show in front of people making the biggest decision of their lives.`}
        accent="var(--purple)"
      />

      <Section>
        <div id="story" className="story">
          <div>
            <Kicker>why this exists</Kicker>
            <p className="story-quote" style={{ marginTop: 12 }}>
              Nature is stronger than any of us. Knowing what it can do to your home shouldn&apos;t be a privilege.
            </p>
            <div className="prose">
              <p>
                When Hurricane Sandy came ashore on the New Jersey coast, our founder&apos;s family home caught fire,
                and the power stayed off for three weeks. It was a lesson in how strong nature is, and in how little
                most families know about what it can do to the place they live, until it does it.
              </p>
              <p>
                That founder is an environmental planner, with a bachelor&apos;s degree in environmental science, a
                master&apos;s in sustainable urban environments, and five years working on climate adaptation and
                infrastructure projects. Those projects run on flood models, heat studies and ground surveys that
                home buyers never get to see. {COMPANY} exists to change that.
              </p>
              <p>
                Our mission is to protect our neighbours: to give people the tools and the knowledge they should have
                before an important decision, so nobody is taken advantage of or left to guess. And because we love the
                natural world, we want to help people and nature understand each other a little better, so both can
                thrive.
              </p>
              <p>
                It&apos;s environmental screening, done properly. It gives you more to go on before you talk to an
                inspector, an engineer or an insurer. It doesn&apos;t replace any of them.
              </p>
            </div>
          </div>
          <div className="story-art">
            <StoryArt />
            <div className="card" style={{ padding: 24, marginTop: 16 }}>
              <div className="kicker">at a glance</div>
              <dl className="dl" style={{ marginTop: 12 }}>
                <dt>founded</dt><dd className="mono">{FOUNDED_YEAR} · {OFFICE_CITY}, {OFFICE_STATE}</dd>
                <dt>entity</dt><dd className="mono">{COMPANY_LEGAL}</dd>
                <dt>free</dt><dd className="mono">the public record, any US address</dd>
                <dt>paid</dt><dd className="mono">the SPARC Labs Field Kit · Storm Ahead</dd>
                <dt>contact</dt><dd className="mono">{EMAIL_PRIMARY}</dd>
              </dl>
            </div>
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
          <Link href="/start" className="btn btn-accent">Get a report <span className="arrow">→</span></Link>
          <Link href="/map" className="btn">Look up an address</Link>
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
