import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import * as React from "react";
import { BRAND_LONG, COMPANY, TAGLINE_LONG, VERSION, COPYRIGHT_YEAR, OFFICE_CITY, OFFICE_STATE } from "@/lib/brand";
import { NavUserStatus } from "./NavUserStatus";
import { MobileNav } from "./MobileNav";

export type NavKey = "home" | "product" | "domains" | "pricing" | "about" | "contact" | "download" | "docs" | "account" | "demo";

const NAV_LINKS: { href: Route; label: string; key: NavKey }[] = [
  { href: "/", label: "Home", key: "home" },
  { href: "/product", label: "Product", key: "product" },
  { href: "/domains", label: "Domains", key: "domains" },
  { href: "/demo", label: "Demo", key: "demo" },
  { href: "/about", label: "About", key: "about" },
];

// Native aspect ratio of public/sparclabs-logo.png is 3300x2550 ≈ 1.294:1
const LOGO_ASPECT = 3300 / 2550;

function LogoLockup({ height = 56 }: { height?: number }) {
  const width = Math.round(height * LOGO_ASPECT);
  return (
    <Image
      src="/sparclabs-logo.png"
      alt={`${COMPANY} — home`}
      width={width}
      height={height}
      priority
      style={{ height, width: "auto", display: "block" }}
    />
  );
}

export function Nav({ active }: { active?: NavKey }) {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="nav-logo" href="/" aria-label={`${COMPANY} — home`}>
          <span className="hide-mobile"><LogoLockup height={56} /></span>
          <span className="show-mobile"><LogoLockup height={36} /></span>
        </Link>
        <nav className="nav-links">
          {NAV_LINKS.map((l) => (
            <Link key={l.key} href={l.href} className={active === l.key ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-cta hide-tablet">
          <Link href="/contact" className="btn btn-ghost btn-sm" style={{ fontWeight: 500, fontSize: 12 }}>
            Contact
          </Link>
          <NavUserStatus />
        </div>
        <div className="nav-cta show-tablet" style={{ marginLeft: "auto" }}>
          <MobileNav links={NAV_LINKS} />
        </div>
      </div>
      <div className="ramp-strip" aria-hidden />
    </header>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link className="nav-logo" href="/" style={{ marginBottom: 14 }}>
              <LogoLockup height={32} />
            </Link>
            <p className="foot-tag" style={{ marginTop: 14 }}>{TAGLINE_LONG}</p>
            <div className="row" style={{ marginTop: 18, gap: 8, flexWrap: "wrap" }}>
              <span className="pill"><span className="dot" style={{ background: "var(--crimson)" }} /> sidecar · ready</span>
              <span className="pill"><span className="dot" style={{ background: "var(--purple)" }} /> claude · sonnet-4.6</span>
            </div>
          </div>
          <div>
            <h6>Product</h6>
            <Link href="/product">Overview</Link>
            <Link href="/product#pipeline">Pipeline</Link>
            <Link href="/product#causal">Causal model</Link>
            <Link href="/product#scenarios">Scenarios</Link>
            <Link href="/domains">Domains</Link>
            <Link href="/demo">Demo</Link>
            <Link href="/changelog">Changelog</Link>
          </div>
          <div>
            <h6>Company</h6>
            <Link href="/about">About</Link>
            <Link href="/about#thesis">Thesis</Link>
            <Link href="/about#principles">Principles</Link>
            <Link href="/research">Research</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <h6>Legal</h6>
            <Link href="/privacy">Privacy</Link>
            <Link href={{ pathname: "/privacy", hash: "cookies" }}>Cookies</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/data-use">Data use</Link>
            <Link href="/docs">Docs</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {COPYRIGHT_YEAR} {COMPANY.toUpperCase()} · {VERSION}</span>
          <span>{OFFICE_CITY} · {OFFICE_STATE} · {BRAND_LONG.toUpperCase()}</span>
        </div>
      </div>
    </footer>
  );
}
