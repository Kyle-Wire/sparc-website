import type { Metadata } from "next";
import { COMPANY } from "@/lib/brand";

// Per-page search and share tags. Without this every page inherited the home
// page's og:title and og:url from the root layout, so a link to /faq shared in
// a message showed "Environmental screening for home buyers" and pointed
// search engines at the home page. Each public page in sitemap.ts wraps its
// metadata in withPage(path, ...), which adds a canonical URL (made absolute
// by metadataBase) and share tags with the page's own title and description.
// Setting openGraph here replaces the root one, so the site-wide share image
// (src/app/opengraph-image.tsx) is named again explicitly.
const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${COMPANY}` };

export function withPage(path: string, meta: { title: string; description: string } & Metadata): Metadata {
  const title = `${meta.title} · ${COMPANY}`;
  return {
    ...meta,
    alternates: { canonical: path },
    openGraph: { title, description: meta.description, url: path, siteName: COMPANY, type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description: meta.description, images: [OG_IMAGE.url] },
  };
}
