"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";

type Item = { href: Route; label: string };

export function MobileNav({
  links,
  extraLinks,
}: {
  links: Item[];
  extraLinks?: Item[];
}) {
  const [open, setOpen] = React.useState(false);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);
  const openBtnRef = React.useRef<HTMLButtonElement>(null);

  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open) return;
    document.body.classList.add("no-scroll");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => {
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey);
      openBtnRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={openBtnRef}
        type="button"
        className="mobile-menu-btn show-tablet"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen(true)}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <div
        className={`drawer-backdrop${open ? " open" : ""}`}
        onClick={close}
        aria-hidden
      />

      <aside
        id="mobile-drawer"
        className={`drawer${open ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!open}
      >
        <div className="drawer-head">
          <span className="kicker">Menu</span>
          <button
            ref={closeBtnRef}
            type="button"
            className="drawer-close"
            aria-label="Close menu"
            onClick={close}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="drawer-links" onClick={close}>
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
          {extraLinks && extraLinks.length > 0 ? (
            <>
              <div className="drawer-divider" />
              {extraLinks.map((l) => (
                <Link key={l.href} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </>
          ) : null}
        </nav>

        <div className="drawer-divider" />

        <div className="drawer-cta">
          <Link href="/contact" className="btn" onClick={close}>
            Contact
          </Link>
          <Link href="/login" className="btn" onClick={close}>
            Sign in
          </Link>
          <Link href="/signup" className="btn btn-primary" onClick={close}>
            Request access →
          </Link>
        </div>
      </aside>
    </>
  );
}
