"use client";

import * as React from "react";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";
import { COMPANY, COMPANY_LEGAL, EMAIL_PRIMARY, OFFICE_FULL } from "@/lib/brand";

type Form = {
  name: string; email: string; org: string; domain: string; crs: string; reason: string;
};

// These are the template directory names in the engine repository. They are the
// names of templates, not a claim that each one is validated: only urban heat
// has a validation record, and that record covers one city. Do not present this
// list as a menu of working products.
const DOMAINS = ["uhi", "coastal", "drought", "geotech", "groundwater", "noise", "seismic", "stormwater", "water", "wildfire", "air", "forcesmip", "blank"];

function ContactForm() {
  const [form, setForm] = React.useState<Form>({ name: "", email: "", org: "", domain: "uhi", crs: "EPSG:32619", reason: "" });
  const [state, setState] = React.useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [ticket, setTicket] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");

  const update = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setTicket(data.ticket ?? "");
      setState("ok");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }

  if (state === "ok") {
    // This panel used to tell every submitter: "We'll send a build with the
    // <DOMAIN> template pre-loaded for <CRS> within 5 business days." There is
    // no build. Every desktop build in the estate reads "(not yet built)" and
    // Studio installs from a clone of a private repository. That sentence was a
    // commitment made automatically to each individual who filled in this form,
    // which is a worse thing than a wrong line of marketing copy. Do not
    // reinstate any delivery promise here until there is something to deliver
    // and a channel to deliver it through.
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 9999, background: "var(--purple)", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} /> request received
        </div>
        <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 12px" }}>Thank you — we have it.</h3>
        <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
          A person will read this and reply to <strong>{form.email}</strong>. To be
          straight with you about where we are: there is no download to send you
          yet. What we can do today is talk about your question and, if it fits,
          run the work ourselves and hand you the results.
        </p>
        {ticket && (
          <div className="mono" style={{ marginTop: 18, fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em" }}>
            ▸ reference · #{ticket}
          </div>
        )}
      </div>
    );
  }

  return (
    <form className="card" style={{ padding: 28 }} onSubmit={submit}>
      <div className="kicker">request access</div>
      <h3 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em", margin: "8px 0 18px" }}>Tell us about your work.</h3>
      <div className="grid-2" style={{ gap: 14 }}>
        <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Your name" /></div>
        <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="you@org.org" /></div>
        <div><label className="label">Organization</label><input className="input" value={form.org} onChange={(e) => update("org", e.target.value)} placeholder="Organization · team" /></div>
        <div><label className="label">Project CRS</label><input className="input mono" value={form.crs} onChange={(e) => update("crs", e.target.value)} placeholder="EPSG:32619" /></div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label">Domain template</label>
          <select className="input" value={form.domain} onChange={(e) => update("domain", e.target.value)}>
            {DOMAINS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label">What are you trying to figure out?</label>
          <textarea className="input" style={{ minHeight: 100, resize: "vertical" }} value={form.reason} onChange={(e) => update("reason", e.target.value)} placeholder="The decision you are trying to make, the area it covers, and the data you already hold." />
        </div>
      </div>
      {state === "error" && <p style={{ color: "var(--crimson)", marginTop: 12, fontSize: 13 }}>{error}</p>}
      <div className="row" style={{ marginTop: 22, justifyContent: "space-between", alignItems: "center" }}>
        <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>▸ one inbox · read by a person</span>
        <button type="submit" className="btn btn-accent" disabled={state === "submitting"}>
          {state === "submitting" ? "Sending…" : "Request access"} <span className="arrow">→</span>
        </button>
      </div>
    </form>
  );
}

export default function ContactPage() {
  return (
    <>
      <Nav active="contact" />
      <PageHero
        kicker="contact · we read everything"
        title="Get in touch."
        lead="Questions, research collaborations, press, or a study you would like us to run. One person reads this inbox."
        accent="var(--amber)"
      />

      <Section>
        <div id="waitlist" className="split-12-10" style={{ gap: 32, alignItems: "start" }}>
          <ContactForm />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card" style={{ borderLeft: "2px solid var(--crimson)" }}>
              <div className="kicker">all enquiries · one inbox</div>
              <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "8px 0 10px", lineHeight: 1.5 }}>
                Everything routes here. {COMPANY} is one person today, so there is
                one address and no routing.
              </p>
              <a className="mono" href={`mailto:${EMAIL_PRIMARY}`} style={{ fontSize: 13, color: "var(--ink)", textDecorationColor: "var(--crimson)" }}>{EMAIL_PRIMARY}</a>
            </div>

            <div className="card dashed">
              <div className="kicker">office · by appointment</div>
              <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "8px 0 0", lineHeight: 1.55 }}>
                <strong>{COMPANY}</strong><br />
                {OFFICE_FULL}
              </p>
              <p className="mono" style={{ fontSize: 11, color: "var(--muted)", margin: "10px 0 0", letterSpacing: "0.1em" }}>
                {COMPANY_LEGAL}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* This section was headed "response times . honest" and published four
          commitments: waitlist <= 5 days, support . pursue <= 48 hrs, support .
          converge <= 24 hrs, support . transcend "Agreed per contract". There is
          no support rota, there is nobody on call, and the three tier names were
          retired on 29 Oct when the prices came down. /pricing simultaneously
          said we "publish no response-time commitment", so the site contradicted
          itself. Do not publish a response time until someone is accountable for
          meeting it. */}
      <Section sunken kicker="what to expect · plainly" title="No support commitment yet.">
        <div className="card" style={{ padding: 22, maxWidth: 760 }}>
          <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.65, margin: 0 }}>
            We used to publish guaranteed response windows against subscription
            tiers. There are no tiers and there is no support rota, so those
            numbers were not commitments anybody could keep and they have been
            withdrawn. In practice one person reads this inbox and usually replies
            within a few business days. If you need a response time you can rely
            on, it belongs in a written agreement for a specific piece of work,
            and we will put it there.
          </p>
        </div>
      </Section>

      <Footer />
    </>
  );
}
