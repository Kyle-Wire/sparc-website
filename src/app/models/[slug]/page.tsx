import type * as React from "react";
import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withPage } from "@/lib/seo";
import { Nav, Footer } from "@/components/shell/Shell";
import { ModelArt } from "@/components/models/ModelArt";
import { MODEL_PAGES, modelPage } from "@/lib/model-pages";

// One page per model (Kyle, 25 Nov 2026). Order: the name and a fun overview
// graphic, how it works in four steps, what it tells you about a house beside
// the table of what goes in, what it never says, then one quiet link to how
// it is tested (Kyle, 23 Nov 2026: proof available, never pushed). The words
// are in src/lib/model-pages.ts, with their sources.

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return MODEL_PAGES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = modelPage(slug);
  if (!m) return {};
  return withPage(`/models/${m.slug}`, {
    title: `${m.name}: ${m.slug === "bristlecone" ? "the checker" : `our ${m.hazard.toLowerCase()} model`}`,
    description: m.lead,
  });
}

export default async function ModelPageRoute({ params }: Props) {
  const { slug } = await params;
  const m = modelPage(slug);
  if (!m) notFound();
  const dark = m.slug === "bristlecone";
  const style = { ["--mp-color" as string]: m.color } as React.CSSProperties;

  return (
    <>
      <Nav active="models" />
      <main id="main" className={dark ? "mp-dark" : undefined} style={style}>
        <section className="mp-hero">
          <div className="wrap mp-hero-grid">
            <div>
              <div className="mp-badge">
                <i style={{ background: dark ? "var(--bristle-ring)" : m.color }} aria-hidden />
                {dark ? "the checker · behind every model" : `${m.hazard} model`}
              </div>
              <h1 className="mp-name">{m.name}</h1>
              <p className="mp-title">{m.title}</p>
              <p className="mp-lead">{m.lead}</p>
              <p className="mp-why">{m.why}</p>
            </div>
            <figure style={{ margin: 0 }}>
              <ModelArt slug={m.slug} />
              <figcaption className="mp-caption">An illustration of how {m.name} works, not a result for any place.</figcaption>
            </figure>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="kicker">how it works</div>
            <h2 style={{ margin: "8px 0 20px" }}>Four steps, every time.</h2>
            <div className="mp-steps">
              {m.steps.map((s) => (
                <div key={s.t} className="mp-step">
                  <h3>{s.t}</h3>
                  <p>{s.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={dark ? "mp-sunk" : undefined} style={dark ? undefined : { background: "var(--paper-2)" }}>
          <div className="wrap mp-two">
            <div>
              <div className="kicker">what goes in</div>
              <h2 style={{ margin: "8px 0 16px" }}>The things {m.name} looks at.</h2>
              <table className="mp-table">
                <thead>
                  <tr>
                    <th scope="col">What</th>
                    <th scope="col">Why it matters</th>
                    <th scope="col">Where it comes from</th>
                  </tr>
                </thead>
                <tbody>
                  {m.variables.map((v) => (
                    <tr key={v.v}>
                      <td>{v.v}</td>
                      <td>{v.why}</td>
                      <td>{v.from}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <div className="kicker">what you get</div>
              <h2 style={{ margin: "8px 0 16px" }}>{dark ? "What it tells us." : "What it tells you about a house."}</h2>
              <ul className="mp-tells">
                {m.tells.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className="kicker" style={{ marginTop: 28 }}>what it never says</div>
              <ul className="mp-tells mp-never" style={{ marginTop: 10 }}>
                {m.never.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <p style={{ marginTop: 24, fontSize: 14 }}>
                {m.where} Runs on {m.engine}. How it is tested is on <Link href="/how-we-test">methods and tests</Link>.
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="kicker">the other models</div>
            <nav className="mp-next" aria-label="Models" style={{ marginTop: 14 }}>
              {MODEL_PAGES.map((o) => (
                <Link
                  key={o.slug}
                  href={`/models/${o.slug}` as Route}
                  aria-current={o.slug === m.slug ? "page" : undefined}
                  style={{ ["--c" as string]: o.slug === "bristlecone" ? "var(--bristle)" : o.color } as React.CSSProperties}
                >
                  <strong>{o.name}</strong>
                  <small>{o.slug === "bristlecone" ? "the checker" : o.hazard.toLowerCase()}</small>
                </Link>
              ))}
            </nav>
            <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 28 }}>
              <Link href="/map" className="btn btn-accent">
                Look up your home <span className="arrow">→</span>
              </Link>
              <Link href="/example" className="btn">
                See an example report
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
