import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/require-same-origin";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const ALLOWED_PROVIDERS = new Set([
  "openai",
  "anthropic",
  "google",
  "mistral",
  "openrouter",
  "ollama",
  "cohere",
  "groq",
]);
const LABEL_RE = /^[A-Za-z0-9 _.\-]{1,64}$/;
const MAX_SECRET_LEN = 4096;

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const rl = await checkRateLimit("apiWrite", `api-keys:${user.id}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) } },
    );
  }

  const body = await req.json().catch(() => null) as { provider?: string; label?: string; secret?: string } | null;
  if (!body?.provider || !body?.label || !body?.secret) {
    return NextResponse.json({ error: "provider, label, and secret are required" }, { status: 400 });
  }

  const provider = body.provider.toLowerCase();
  if (!ALLOWED_PROVIDERS.has(provider)) {
    return NextResponse.json({ error: "unsupported provider" }, { status: 400 });
  }
  if (!LABEL_RE.test(body.label)) {
    return NextResponse.json({ error: "invalid label" }, { status: 400 });
  }
  if (typeof body.secret !== "string" || body.secret.length === 0 || body.secret.length > MAX_SECRET_LEN) {
    return NextResponse.json({ error: "invalid secret" }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdminClient();
    // Persist via the encrypt_api_key Postgres function (defined in migration 0001).
    // The function wraps Supabase Vault and returns the row WITHOUT the secret.
    const { data, error } = await admin.rpc("encrypt_api_key", {
      p_user_id: user.id,
      p_provider: provider,
      p_label: body.label,
      p_secret: body.secret,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, key: data });
  } catch (err) {
    console.error("[api-keys] add failed:", err);
    return NextResponse.json({ error: "could not save key" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "valid id required" }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("api_keys").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api-keys] delete failed:", err);
    return NextResponse.json({ error: "could not delete" }, { status: 500 });
  }
}
