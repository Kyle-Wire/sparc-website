"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Asks the page's sources again. Shown on a card whose source did not answer.
 * It re-runs the page's lookups on the server; answers that did arrive are
 * kept by the server's cache, so only the missing ones are asked again.
 */
export function RetryButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button type="button" className="btn btn-sm" disabled={pending} onClick={() => start(() => router.refresh())}>
      {pending ? "Asking again…" : "Try again"}
    </button>
  );
}
