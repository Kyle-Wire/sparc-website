"use client";

import * as React from "react";
import Link from "next/link";
import { Nav, Footer } from "@/components/shell/Shell";
import { PageHero, Section } from "@/components/marketing/page-shell";

type Status = "beta" | "roadmap" | "blank";

type Domain = {
  id: string;
  name: string;
  sub: string;
  tag: string;
  status: Status;
  c: string;
  body: string;
  physics: string;
};

const DOMAINS: Domain[] = [
  {
    id: "uhi", name: "UHI", sub: "Urban Heat Island", tag: "climate · urban",
    status: "beta", c: "var(--crimson)",
    body: "Quantify and project urban heat anomalies. Inputs: LST rasters, canopy %, impervious %, building height, wind. Outputs: AAT_z scenarios, intervention rasters.",
    physics: "Surface energy balance Rn = H + LE + G; heat diffusion ρc ∂T/∂t = ∇·(k∇T) + S",
  },
  {
    id: "smip", name: "ForceSMIP", sub: "Forced response", tag: "research · ML",
    status: "beta", c: "var(--purple)",
    body: "Detection-and-attribution of forced climate response from internal variability. CMIP6 input, posterior trace output.",
    physics: "Signal-to-noise pattern detection on CMIP6 ensembles; forced-response regression (statistical, not a PDE)",
  },
  {
    id: "coastal", name: "Coastal", sub: "Erosion & sea-level", tag: "climate · coastal",
    status: "roadmap", c: "var(--purple)",
    body: "Shoreline retreat under SLR scenarios. Inputs: bathymetry, wave climate, sediment grain size. Outputs: retreat rate posteriors, vulnerability rasters.",
    physics: "Shallow-water equations + Exner sediment continuity ∂z_b/∂t + 1/(1−p) ∇·q_s = 0",
  },
  {
    id: "drought", name: "Drought", sub: "Soil moisture · ET", tag: "climate · agri",
    status: "roadmap", c: "var(--amber)",
    body: "Soil moisture deficit and evapotranspiration with crop water stress indices. Inputs: SMAP, MODIS ET, precipitation. Outputs: SPEI, σ rasters.",
    physics: "Richards' equation ∂θ/∂t = ∇·(K(θ)∇(ψ+z)); Penman–Monteith ET",
  },
  {
    id: "geotech", name: "Geotechnical", sub: "Bearing capacity", tag: "civil · structural",
    status: "roadmap", c: "var(--gold)",
    body: "Site-specific bearing capacity from CPT/SPT logs and surface geology. Outputs: capacity rasters with depth-of-influence.",
    physics: "Terzaghi/Meyerhof bearing equilibrium; 1D consolidation ∂u/∂t = c_v ∇²u",
  },
  {
    id: "ground", name: "Groundwater", sub: "Aquifer drawdown", tag: "hydrology",
    status: "roadmap", c: "var(--magenta)",
    body: "Pump-test drawdown response across heterogeneous aquifers. Inputs: well logs, lithology, recharge. Outputs: cone-of-depression scenarios.",
    physics: "Darcy + groundwater diffusion S_s ∂h/∂t = ∇·(K∇h) + W",
  },
  {
    id: "noise", name: "Noise", sub: "Lp around sources", tag: "civil · airport",
    status: "roadmap", c: "var(--pink)",
    body: "Sound pressure propagation around airports, highways, and industrial sites. Outputs: dBA isolines under operational scenarios.",
    physics: "Helmholtz wave equation ∇²p + k²p = 0 with geometric + atmospheric attenuation",
  },
  {
    id: "seismic", name: "Seismic", sub: "PSHA + site response", tag: "civil · risk",
    status: "roadmap", c: "var(--red)",
    body: "Probabilistic seismic hazard with Vs30-conditioned site amplification. Outputs: PGA hazard rasters with disaggregation.",
    physics: "Elastic wave equation ρ ∂²u/∂t² = ∇·σ; 1D SH site amplification",
  },
  {
    id: "storm", name: "Stormwater", sub: "Runoff · flooding", tag: "hydrology · urban",
    status: "roadmap", c: "var(--orange)",
    body: "TR-55 + 2D routing with green-infrastructure perturbations. Outputs: depth/extent rasters, design-storm comparisons.",
    physics: "2D Saint-Venant shallow water + Green–Ampt infiltration",
  },
  {
    id: "water", name: "Water Quality", sub: "DO · nutrients", tag: "hydrology · enviro",
    status: "roadmap", c: "var(--crimson)",
    body: "Dissolved oxygen, total N, total P, fecal coliform under land-use scenarios. Outputs: 303(d) classification rasters.",
    physics: "Advection–diffusion–reaction ∂C/∂t + u·∇C = ∇·(D∇C) + R(C)",
  },
  {
    id: "fire", name: "Wildfire", sub: "Fuel · weather · ROS", tag: "climate · risk",
    status: "roadmap", c: "var(--orange)",
    body: "Rate-of-spread and burn probability with fuel-treatment scenarios. Inputs: LANDFIRE, RAWS, topography. Outputs: BP, FLI rasters.",
    physics: "Rothermel ROS with level-set front propagation ∂φ/∂t + R|∇φ| = 0",
  },
  {
    id: "air", name: "Air Quality", sub: "PM₂.₅ + dispersion", tag: "climate · public-health",
    status: "roadmap", c: "var(--pink)",
    body: "PM₂.₅ and ozone with stationary + mobile sources. Inputs: CMAQ, monitoring stations, traffic. Outputs: exposure rasters with σ.",
    physics: "Eulerian advection–diffusion + chemistry ∂C/∂t + ∇·(uC) = ∇·(K∇C) + E − L",
  },
  {
    id: "blank", name: "Blank", sub: "Start from scratch", tag: "custom",
    status: "blank", c: "var(--muted)",
    body: "Empty project skeleton. project.yml + DAG + variable registry. Bring your own data, variables, and governing equations.",
    physics: "user-defined",
  },
];

const STATUS_LABEL: Record<Status, string> = {
  beta: "active in beta",
  roadmap: "on the roadmap",
  blank: "blank slate",
};

const STATUS_DOT: Record<Status, string> = {
  beta: "var(--crimson)",
  roadmap: "var(--muted)",
  blank: "var(--ink-2)",
};

function ctaForStatus(d: Domain): { label: string; href: string } {
  if (d.status === "beta") return { label: "Request beta access", href: "/demo" };
  if (d.status === "roadmap") return { label: `Collaborate on ${d.name}`, href: "/contact" };
  return { label: "Talk to us", href: "/contact" };
}

export default function DomainsPage() {
  const [sel, setSel] = React.useState<Domain>(DOMAINS[0]);
  const cta = ctaForStatus(sel);
  return (
    <>
      <Nav active="domains" />
      <PageHero
        kicker="private beta · 2 active domains · more on the roadmap"
        title="Built for any spatial domain."
        lead="SPARC is a general-purpose causal pipeline for spatial science. We're currently validating it on Urban Heat Island and ForceSMIP with our beta partners — and expanding to new domains as physics integrations land. The list below is where we're heading; tell us where you want it to go next."
      />
      <Section>
        <div className="split-14-10" style={{ gap: 28, alignItems: "start" }}>
          <div className="grid-3" style={{ gap: 12 }}>
            {DOMAINS.map((d) => {
              const active = sel.id === d.id;
              const dim = d.status === "roadmap" && !active;
              return (
                <button key={d.id} onClick={() => setSel(d)} style={{
                  textAlign: "left", border: "1px solid var(--line)",
                  background: active ? "var(--ink)" : "var(--bg-elevated)",
                  color: active ? "var(--paper)" : "var(--ink)",
                  borderRadius: 8, padding: 16, cursor: "pointer", fontFamily: "inherit",
                  borderLeftWidth: 3, borderLeftColor: d.c, transition: "all .15s",
                  opacity: dim ? 0.78 : 1,
                }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>{d.name}</h3>
                    <span className="mono" style={{
                      fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase",
                      padding: "2px 6px", borderRadius: 3,
                      background: active ? "rgba(245,239,228,0.12)" : "var(--paper-2)",
                      color: active ? "rgba(245,239,228,0.85)" : "var(--ink-2)",
                      display: "inline-flex", alignItems: "center", gap: 5,
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: STATUS_DOT[d.status], display: "inline-block" }} />
                      {d.status}
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: 11, marginTop: 4, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em" }}>{d.sub}</div>
                  <div className="kicker" style={{ marginTop: 14, color: active ? "rgba(245,239,228,0.55)" : "var(--muted)" }}>{d.tag}</div>
                </button>
              );
            })}
          </div>
          <div className="sticky-md-up" style={{ position: "sticky", top: 80 }}>
            <div className="card" style={{ padding: 0, overflow: "hidden", borderLeft: `3px solid ${sel.c}` }}>
              <div style={{ padding: 18, borderBottom: "1px solid var(--line)" }}>
                <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                  <div className="kicker">{sel.tag}</div>
                  <span className="pill"><span className="dot" style={{ background: STATUS_DOT[sel.status] }} /> {STATUS_LABEL[sel.status]}</span>
                </div>
                <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em", margin: "8px 0 4px" }}>{sel.name}</h2>
                <div className="mono" style={{ fontSize: 12, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{sel.sub}</div>
              </div>
              <div style={{ padding: 18 }}>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)", margin: "0 0 14px" }}>{sel.body}</p>
                <dl className="dl">
                  <dt>physics</dt><dd className="mono" style={{ lineHeight: 1.5 }}>{sel.physics}</dd>
                </dl>
                <div className="row" style={{ marginTop: 18, gap: 8 }}>
                  <Link className="btn btn-accent" href={cta.href as never}>{cta.label} →</Link>
                  <Link className="btn" href="/product">See the pipeline</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section sunken kicker="bring your own" title="What if your domain isn't here?">
        <div className="grid-3" style={{ gap: 18 }}>
          {[
            { k: "01", t: "Start from a blank slate.", b: "The Blank domain is a project skeleton — project.yml, an empty DAG, an empty variable registry. Add your variables, propose your edges, and run." },
            { k: "02", t: "Adapt the closest domain.", b: "Geotech for ground stability? Hydrology for surface water? Most spatial domains share more structure than they look — we'll help you adapt the nearest one." },
            { k: "03", t: "Co-develop with us.", b: "Propose a domain. If it fits the roadmap we'll integrate the physics with you, then publish it as a first-class SPARC domain." },
          ].map((s, i) => (
            <div key={i} className="card dashed">
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, padding: "3px 7px", borderRadius: 3, background: "var(--ink)", color: "#fff" }}>{s.k}</span>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: "12px 0 8px" }}>{s.t}</h3>
              <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, margin: 0 }}>{s.b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Footer />
    </>
  );
}
