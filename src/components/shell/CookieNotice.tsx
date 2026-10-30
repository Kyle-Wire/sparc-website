"use client";

import * as React from "react";
import Link from "next/link";

const STORAGE_KEY = "sparc.cookie-notice.v1";

export function CookieNotice() {
  // `null` = not yet decided (don't render to avoid SSR/hydration flicker)
  const [visible, setVisible] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY) === "dismissed";
      // localStorage does not exist during SSR; reading it in render would hydrate differently.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(!dismissed);
    } catch {
      // localStorage blocked (private mode, etc.) — show the notice this session.
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* no-op */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 1000,
        maxWidth: 720,
        margin: "0 auto",
        background: "var(--paper)",
        color: "var(--ink)",
        border: "1px solid var(--rule)",
        borderRadius: 10,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        padding: "14px 16px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      <p style={{ margin: 0, flex: "1 1 280px" }}>
        We use only essential cookies to keep you signed in. No tracking, no
        analytics.{" "}
        <Link href="/privacy#cookies" style={{ textDecoration: "underline" }}>
          Learn more
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="btn btn-sm"
        style={{ fontWeight: 500 }}
      >
        Got it
      </button>
    </div>
  );
}
