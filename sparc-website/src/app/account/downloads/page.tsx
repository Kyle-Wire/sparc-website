import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { VERSION } from "@/lib/brand";

export const dynamic = "force-dynamic";

const BUILDS = [
  { os: "macOS · Apple Silicon", file: `SPARC-${VERSION}-arm64.dmg`, sha: "(not yet built)" },
  { os: "macOS · Intel", file: `SPARC-${VERSION}-x64.dmg`, sha: "(not yet built)" },
  { os: "Windows · x64", file: `SPARC-${VERSION}-setup.exe`, sha: "(not yet built)" },
  { os: "Linux · deb", file: `sparc_${VERSION.replace("v", "")}_amd64.deb`, sha: "(not yet built)" },
  { os: "Linux · AppImage", file: `SPARC-${VERSION}.AppImage`, sha: "(not yet built)" },
];

interface Key { id: string; tier: string; key_prefix: string; activated_at: string | null; }

export default async function DownloadsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let keys: Key[] = [];
  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin.from("license_keys").select("id,tier,key_prefix,activated_at").eq("user_id", user.id);
    keys = data ?? [];
  } catch { /* dev */ }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="card" style={{ padding: 24 }}>
        <div className="kicker">downloads · {VERSION}</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", margin: "8px 0 0" }}>SPARC Desktop</h2>
        <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55, margin: "8px 0 16px" }}>
          Sign in inside the app with the same email you used here — your license activates automatically.
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          {BUILDS.map((b) => (
            <div key={b.file} className="row" style={{ justifyContent: "space-between", alignItems: "center", padding: "12px 16px", border: "1px solid var(--line)", borderRadius: 6 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{b.os}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{b.file} · sha256 {b.sha}</div>
              </div>
              <button className="btn btn-sm" disabled>Coming soon</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div className="kicker">license keys</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "8px 0 16px" }}>Your activations</h2>
        {keys.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>No license keys issued yet. Subscribe to Pursue or Converge to receive one.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {keys.map((k) => (
              <div key={k.id} className="row" style={{ justifyContent: "space-between", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 6 }}>
                <div className="mono" style={{ fontSize: 13 }}>{k.key_prefix}••••••••• <span className="pill" style={{ marginLeft: 8 }}>{k.tier}</span></div>
                <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{k.activated_at ? `activated ${new Date(k.activated_at).toLocaleDateString()}` : "unused"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
