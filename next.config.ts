import type { NextConfig } from "next";

// Content-Security-Policy.
// Enforcing mode (verified clean in Report-Only on production). `'unsafe-inline'`
// in script-src is retained because Next.js App Router inlines hydration data;
// tighten to nonces in a future pass.
// To re-enter Report-Only mode (e.g. when adding a new third-party origin),
// rename the header below to `Content-Security-Policy-Report-Only`.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  // The four agency hosts are the public map layers on a place page. The map
  // library fetches tiles itself, so they are connect-src, not img-src. Add a
  // host here only for a published public layer; see the source table in
  // docs/design/site-redesign-brief.md.
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.lemonsqueezy.com " +
    "https://basemap.nationalmap.gov https://hazards.fema.gov https://coast.noaa.gov https://www.mrlc.gov " +
    "https://tiles.arcgis.com https://earthquake.usgs.gov",
  // The map library runs its tile worker from a blob it builds itself.
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  // The house report's checkout is Stripe's hosted page: the order form posts
  // to /api/reports/order, which redirects there (docs/payments.md).
  "form-action 'self' https://checkout.stripe.com https://*.lemonsqueezy.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const config: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // Authenticated surfaces — disallow shared / browser caching of user data.
        source: "/account/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, must-revalidate, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
      {
        source: "/api/account/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, must-revalidate, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Old static-prototype URLs → App Router routes
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/pricing.html", destination: "/pricing", permanent: true },
      { source: "/about.html", destination: "/about", permanent: true },
      { source: "/contact.html", destination: "/contact", permanent: true },
      // Pages for the old causal heat model, retired 2026-11-17. Temporary
      // redirects (307), not permanent: this is a first draft of the new
      // site, and a permanent redirect is cached by browsers for good.
      { source: "/product.html", destination: "/models", permanent: false },
      { source: "/product", destination: "/models", permanent: false },
      { source: "/templates.html", destination: "/models", permanent: false },
      { source: "/templates", destination: "/models", permanent: false },
      { source: "/domains", destination: "/models", permanent: false },
      { source: "/research", destination: "/models", permanent: false },
      { source: "/docs", destination: "/models", permanent: false },
      { source: "/demo", destination: "/contact", permanent: false },
      { source: "/download", destination: "/", permanent: false },
      { source: "/changelog", destination: "/", permanent: false },
    ];
  },
};

export default config;
