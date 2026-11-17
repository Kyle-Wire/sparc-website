import Link from "next/link";
import type { Route } from "next";
import { Nav, Footer } from "@/components/shell/Shell";
import { Kicker, Section } from "@/components/marketing/page-shell";
import { PlaceSearch } from "@/components/place/PlaceSearch";
import { LockedShelf } from "@/components/place/cards";

// The home page is the search box. Everything under it explains what the
// search returns and what paying would add.
//
// Claims on this page, and what each rests on:
//   "free, no account"           the place page needs neither (src/app/place).
//   the list of public records   each is fetched live on a place page; sources
//                                are in docs/design/site-redesign-brief.md s.11.
//   the paid shelves             described as not on sale, and drawn with the
//                                placeholder register so they carry no numbers.
// Do not add a figure, a customer, a city or a validation claim here.

// City halls and capitols: public buildings, rounded to the block like every
// other place on the site. They are examples of where to look, not studies.
const EXAMPLES: { label: string; slug: string }[] = [
  { label: "Charleston, SC", slug: "32.776,-79.931" },
  { label: "Houston, TX", slug: "29.760,-95.369" },
  { label: "Sacramento, CA", slug: "38.577,-121.494" },
  { label: "Miami Beach, FL", slug: "25.791,-80.132" },
];

const SHELVES: { name: string; state: string; body: string }[] = [
  {
    name: "On record",
    state: "Free · no account",
    body: "What public agencies already hold about the place: FEMA flood zones, flood insurance claims nearby, disaster declarations, past hurricane tracks, sea level rise, FEMA's rating of eighteen hazards, tree canopy and paving. Click anywhere on the map to read a spot.",
  },
  {
    name: "Modelled",
    state: "Paid · not on sale yet",
    body: "Our own flood and heat models, run for the neighbourhood around the property: where storm water goes street by street, and how warm the air is by day and by night.",
  },
  {
    name: "What if",
    state: "Paid · not on sale yet",
    body: "Try a project in the model before paying for it: a rain garden, a French drain, less paving, more trees. You see what it is likely to change, with the margins. Not a promise.",
  },
];

const HAZARDS: { name: string; record: string; model: string; whatIf: string; live: boolean }[] = [
  {
    name: "Flood",
    record: "FEMA flood zones, insurance claims, disaster declarations, hurricane tracks, sea level rise, ground elevation",
    model: "Storm water through the neighbourhood: preset storms, your own storm, live radar",
    whatIf: "Rain garden, French drain, paving removed, rain barrels",
    live: true,
  },
  {
    name: "Heat",
    record: "Tree canopy and paving",
    model: "Surface temperature, street air temperature, outdoor comfort in sun and shade",
    whatIf: "Trees, paving removed, cool roofs, cool pavement",
    live: true,
  },
  {
    name: "Everything else",
    record: "FEMA's rating of eighteen hazards for the area: wildfire, earthquake, tornado and the rest",
    model: "Not planned",
    whatIf: "Not planned",
    live: true,
  },
  {
    name: "Ground",
    record: "To be decided",
    model: "Ground movement measured from satellite radar",
    whatIf: "The measured rate carried forward",
    live: false,
  },
  {
    name: "Wind",
    record: "Hurricane tracks",
    model: "How wind moves through the seasons",
    whatIf: "To be decided",
    live: false,
  },
];

const KEEP: { title: string; body: string }[] = [
  {
    title: "Questions to take with you",
    body: "Each place page ends with a list for the seller, the inspector and the insurer, chosen from what the record shows there. Print it and bring it to the viewing.",
  },
  {
    title: "Save a place, with your note",
    body: "A saved place keeps your note and a snapshot of what the record said that day. It stays in your browser: no account, and nothing is sent to us.",
  },
  {
    title: "Compare the homes you are weighing up",
    body: "Put up to four places side by side, record by record, with each row saying whether it describes the block, the census tract or the county.",
  },
];

const STEPS = [
  { no: "01", title: "Find a place", body: "Type any US address. The site finds the block and drops the address." },
  { no: "02", title: "Read the record", body: "A large map of the neighbourhood with public layers, a card for each record with its source and date, and a click anywhere to read that spot." },
  { no: "03", title: "Run the models", body: "Paid, and not on sale yet. Flood and heat for the neighbourhood, with the property in the middle." },
  { no: "04", title: "Try a project, or take the report", body: "Test what you could do about it, or take a report for one property and be done." },
];

export default function HomePage() {
  return (
    <>
      <Nav active="home" />

      <section className="home-hero grid-bg">
        <div className="wrap">
          <Kicker dot>environmental screening · any US address</Kicker>
          <h1>See what is on record before you buy.</h1>
          <p className="lead">
            Flood zones, flood insurance claims, disaster declarations, storm tracks and sea level rise for
            the neighbourhood around any address in the United States. The public record is free.
          </p>
          <PlaceSearch />
          <div className="place-examples">
            <span>Or look at:</span>
            {EXAMPLES.map((e) => (
              <Link key={e.slug} href={`/place/${e.slug}` as Route}>
                {e.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Section
        kicker="what you get"
        title="Three shelves for every hazard."
        lead="The first is open to everyone. The other two are our own models, and they are not on sale yet."
      >
        <div className="grid-3" style={{ gap: 18 }}>
          {SHELVES.map((s) => (
            <div key={s.name} className="card" style={{ padding: 24 }}>
              <div className="kicker">{s.state}</div>
              <h3 style={{ margin: "10px 0 12px" }}>{s.name}</h3>
              <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div className="table-scroll" style={{ marginTop: 32 }}>
          <table className="plain-table">
            <thead>
              <tr>
                <th>Hazard</th>
                <th>On record · free</th>
                <th>Modelled · paid</th>
                <th>What if · paid</th>
              </tr>
            </thead>
            <tbody>
              {HAZARDS.map((h) => (
                <tr key={h.name}>
                  <td>
                    {h.name}
                    {!h.live && <span className="record-aside"> · coming</span>}
                  </td>
                  <td>{h.record}</td>
                  <td>{h.model}</td>
                  <td>{h.whatIf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        kicker="keep hold of it"
        title="Buying a home is a lot to carry. Put some of it down here."
        action={<Link href="/places" className="btn">Your places <span className="arrow">→</span></Link>}
      >
        <div className="grid-3" style={{ gap: 18 }}>
          {KEEP.map((k) => (
            <div key={k.title} className="card" style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 10px" }}>{k.title}</h3>
              <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{k.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <section style={{ background: "var(--paper-2)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <Kicker>the paid shelves · layout only</Kicker>
              <h2 style={{ marginTop: 8 }}>What a model run will add.</h2>
            </div>
            <p className="lead">
              These panels show the shape of a result. They hold no numbers, because no run stands behind
              them. For now a report is run by hand on request.
            </p>
          </div>
          <div className="shelf-pair">
            <LockedShelf kind="flood-model" cta={false} />
            <LockedShelf kind="heat-whatif" cta={false} />
          </div>
          <div className="row" style={{ marginTop: 24, gap: 10 }}>
            <Link href="/models" className="btn">How the models work <span className="arrow">→</span></Link>
            <Link href="/contact" className="btn btn-accent">Ask for a report <span className="arrow">→</span></Link>
          </div>
        </div>
      </section>

      <Section kicker="how it works" title="From an address to an answer." lead="Steps one and two work today. Three and four are being built.">
        <div className="steps-row" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)" }}>
          {STEPS.map((s, i) => (
            <div key={s.no} className="steps-cell" style={{ padding: "26px 22px", borderRight: i < STEPS.length - 1 ? "1px solid var(--line)" : "none" }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: "var(--ink)", color: "#fff" }}>{s.no}</span>
              <h4 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.015em", margin: "12px 0 10px" }}>{s.title}</h4>
              <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, lineHeight: 1.55 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="compact" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="wrap">
          <p className="screening-note">
            <strong>A screening tool.</strong> It gives a buyer or a resident more to go on: what has
            happened around a place and what could. It is not an engineering study, an appraisal, an insurance
            quote or a home inspection, and it is not for engineering decisions. A home is a big purchase and
            this information is public; it should be easy to read.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
