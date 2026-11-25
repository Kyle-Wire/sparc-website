"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { HAZARD_MODELS, CHECKER_PAGE } from "@/lib/model-pages";

// The Models dropdown in the menu bar (Kyle, 25 Nov 2026: "when you're
// hovering over models in the menu bar, it provides like a drop down, and
// then it gives you each of the models"). It opens on hover for a mouse, on
// click or Enter for touch and keyboard, and closes on Escape or leaving.

export function NavModels({ active }: { active?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 140);
  };

  React.useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className={`nav-drop${open ? " open" : ""}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        className={`nav-drop-btn${active ? " active" : ""}`}
        aria-expanded={open}
        aria-controls="nav-models"
        onClick={() => setOpen(!open)}
      >
        Models
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
          <path d="M1.5 3.5L5 7l3.5-3.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      <div id="nav-models" className="nav-drop-panel" onClick={() => setOpen(false)}>
        <Link href="/models" className="nav-drop-all">
          <span />
          <span className="nav-drop-name">All the models</span>
          <span className="nav-drop-line">What each one does, and how they work together.</span>
        </Link>
        {HAZARD_MODELS.map((m) => (
          <Link key={m.slug} href={`/models/${m.slug}` as Route}>
            <i className="nav-drop-dot" style={{ background: m.color }} aria-hidden />
            <span className="nav-drop-name">
              {m.name}
              <small>{m.hazard.toLowerCase()}</small>
            </span>
            <span className="nav-drop-line">{m.line}</span>
          </Link>
        ))}
        <Link href={`/models/${CHECKER_PAGE.slug}` as Route} className="nav-drop-checker">
          <i className="nav-drop-dot" style={{ background: "var(--bristle-ring)" }} aria-hidden />
          <span className="nav-drop-name">
            {CHECKER_PAGE.name}
            <small>the checker</small>
          </span>
          <span className="nav-drop-line">{CHECKER_PAGE.line}</span>
        </Link>
      </div>
    </div>
  );
}
