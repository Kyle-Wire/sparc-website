// Open-redirect guard. Accepts only same-origin relative paths.
// Rejects:
//   - absolute URLs ("https://evil.com")
//   - protocol-relative URLs ("//evil.com")
//   - backslash tricks ("/\\evil.com" → some browsers normalize to //evil.com)
//   - anything that doesn't start with "/"
export function safeNext(raw: string | null | undefined, fallback = "/account"): string {
  if (!raw) return fallback;
  const v = String(raw);
  if (v.length > 512) return fallback;
  if (!v.startsWith("/")) return fallback;
  if (v.startsWith("//") || v.startsWith("/\\")) return fallback;
  // Disallow CR/LF (header-injection) and null bytes.
  if (/[\r\n\0]/.test(v)) return fallback;
  return v;
}
