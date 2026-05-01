"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

type Item = { href: Route; label: string };

export function AccountNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  return (
    <nav className="account-nav">
      {items.map((n) => {
        const active = pathname === n.href;
        return (
          <Link key={n.href} href={n.href} className={active ? "active" : undefined}>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
