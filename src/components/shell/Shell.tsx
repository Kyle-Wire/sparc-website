import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import * as React from "react";
import { COMPANY, TAGLINE_LONG, COPYRIGHT_YEAR, OFFICE_CITY, OFFICE_STATE } from "@/lib/brand";
import { NavUserStatus } from "./NavUserStatus";
import { MobileNav } from "./MobileNav";
import { NavModels } from "./NavModels";
import { MODEL_PAGES } from "@/lib/model-pages";

export type NavKey = "home" | "how" | "places" | "models" | "storm" | "example" | "pricing" | "about" | "contact" | "account";

// The menu bar, agreed with Kyle on 25 Nov 2026 (sitemap v2): How it works is
// the landing page, the map is "Look up a home", Models opens a dropdown of
// every model (NavModels), and the same bar sits on the map. "Your places"
// moved to the footer and the map's own panel.
const NAV_BEFORE: { href: Route; label: string; key: NavKey }[] = [
  { href: "/", label: "How it works", key: "how" },
  { href: "/map", label: "Look up a home", key: "home" },
];
const NAV_AFTER: { href: Route; label: string; key: NavKey }[] = [
  { href: "/storm-ahead", label: "Storm Ahead", key: "storm" },
  { href: "/example", label: "Example report", key: "example" },
  { href: "/pricing", label: "Pricing", key: "pricing" },
  { href: "/about", label: "About", key: "about" },
];
const DRAWER_TOP: { href: Route; label: string }[] = NAV_BEFORE;
const DRAWER_MODELS: { href: Route; label: string }[] = [
  { href: "/models", label: "All the models" },
  ...MODEL_PAGES.map((m) => ({ href: `/models/${m.slug}` as Route, label: `${m.name} · ${m.slug === "bristlecone" ? "the checker" : m.hazard.toLowerCase()}` })),
];
const DRAWER_BOTTOM: { href: Route; label: string }[] = [...NAV_AFTER, { href: "/acorn", label: "Acorn sensor · coming soon" }, { href: "/contact", label: "Contact" }];

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
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="nav-inner">
        <Link className="nav-logo" href="/" aria-label={`${COMPANY} — home`}>
          <span className="hide-mobile"><LogoLockup height={56} /></span>
          <span className="show-mobile"><LogoLockup height={36} /></span>
        </Link>
        <nav className="nav-links" aria-label="Site">
          {NAV_BEFORE.map((l) => (
            <Link key={l.key} href={l.href} className={active === l.key ? "active" : ""}>
              {l.label}
            </Link>
          ))}
          <NavModels active={active === "models"} />
          {NAV_AFTER.map((l) => (
            <Link key={l.key} href={l.href} className={active === l.key ? "active" : ""}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="nav-cta hide-tablet">
          <NavUserStatus />
        </div>
        <div className="nav-cta show-tablet" style={{ marginLeft: "auto" }}>
          <MobileNav links={DRAWER_TOP} groups={[{ head: "Models", links: DRAWER_MODELS }]} extraLinks={DRAWER_BOTTOM} />
        </div>
      </div>
      <div className="ramp-strip" aria-hidden />
    </header>
  );
}

export function Footer() {
  return (
    <footer aria-label="Site footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <Link className="nav-logo" href="/" style={{ marginBottom: 14 }}>
              <LogoLockup height={32} />
            </Link>
            <p className="foot-tag" style={{ marginTop: 14 }}>{TAGLINE_LONG}</p>
            <p className="foot-tag" style={{ marginTop: 10 }}>A screening tool. Not for engineering decisions.</p>
          </div>
          <div>
            <h2 className="foot-h">The site</h2>
            <Link href="/">How it works</Link>
            <Link href="/map">Look up a home</Link>
            <Link href="/places">Your places</Link>
            <Link href="/storm-ahead">Storm Ahead</Link>
            <Link href="/acorn">Acorn sensor</Link>
            <Link href="/example">Example report</Link>
            <Link href="/glossary">Plain glossary</Link>
            <Link href="/data">Data sources</Link>
            <Link href="/models">The models</Link>
            <Link href="/how-we-test">Methods and tests</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/faq">Questions</Link>
            <Link href="/next-steps">After your report</Link>
          </div>
          <div>
            <h2 className="foot-h">Company</h2>
            <Link href="/about">About</Link>
            <Link href="/about#principles">Principles</Link>
            <Link href="/contact">Contact</Link>
          </div>
          <div>
            <h2 className="foot-h">Legal</h2>
            <Link href="/privacy">Privacy</Link>
            <Link href={{ pathname: "/privacy", hash: "cookies" }}>Cookies</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/data-use">Data use</Link>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {COPYRIGHT_YEAR} {COMPANY.toUpperCase()}</span>
          <span>{OFFICE_CITY} · {OFFICE_STATE}</span>
        </div>
      </div>
    </footer>
  );
}
