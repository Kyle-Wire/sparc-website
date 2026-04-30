"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function NavUserStatus() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [name, setName] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      const u = data.user;
      setEmail(u?.email ?? null);
      setName((u?.user_metadata?.full_name as string | undefined) ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setEmail(u?.email ?? null);
      setName((u?.user_metadata?.full_name as string | undefined) ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <span style={{ width: 80, height: 28, display: "inline-block" }} aria-hidden />;
  }

  if (!email) {
    return (
      <>
        <Link href="/login" className="btn btn-ghost btn-sm" style={{ fontWeight: 500, fontSize: 12 }}>
          Sign in
        </Link>
        <Link href="/signup" className="btn btn-primary btn-sm">
          Request access <span className="arrow">→</span>
        </Link>
      </>
    );
  }

  const greetingName = name || email.split("@")[0];

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-ghost btn-sm"
        style={{ fontWeight: 500, fontSize: 12 }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Hi, {greetingName}
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 200,
            background: "var(--bg-elevated)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            boxShadow: "0 12px 32px -12px rgba(26,20,22,0.18)",
            padding: 6,
            zIndex: 50,
          }}
        >
          <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid var(--line)", marginBottom: 4 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Signed in as</div>
            <div style={{ fontSize: 13, color: "var(--ink)", wordBreak: "break-all" }}>{email}</div>
          </div>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            style={{ display: "block", padding: "8px 10px", fontSize: 13, color: "var(--ink)", borderRadius: 4, textDecoration: "none" }}
          >
            Account
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 10px",
              fontSize: 13,
              color: "var(--crimson)",
              background: "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
