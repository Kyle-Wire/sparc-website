"use client";

import Link from "next/link";
import * as React from "react";

// Shown when a page throws. Says plainly what happened and what is safe, and
// offers a retry. The digest lets support find the server log line.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="wrap" style={{ padding: "96px var(--wrap-pad) 96px", maxWidth: 720 }}>
      <div className="kicker">something went wrong</div>
      <h1 style={{ margin: "10px 0 14px" }}>This page did not load.</h1>
      <p className="lead" style={{ marginBottom: 24 }}>
        That is our fault, not yours. Try again, and if it keeps happening, write to us and we will
        look. If you were placing an order, look in your account under Your reports before trying again,
        so the same report is not ordered twice.
      </p>
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-accent" onClick={() => reset()}>Try again</button>
        <Link className="btn btn-ghost" href="/">Back to the map</Link>
        <Link className="btn btn-ghost" href="/contact">Write to us</Link>
      </div>
      {error.digest && (
        <p className="mono" style={{ marginTop: 24, fontSize: 11, color: "var(--muted)", letterSpacing: "0.08em" }}>
          reference · {error.digest}
        </p>
      )}
    </main>
  );
}
