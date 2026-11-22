import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";

// Search engines may read the public pages. Place pages, accounts, the order
// path and the API stay out: place pages are hidden on purpose (docs/HANDOFF.md
// §7.5, a separate decision for Kyle), and each of those pages also carries
// its own noindex. Disallow here only saves crawlers the trip.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/account", "/auth/", "/place/", "/places", "/compare", "/report/buy", "/start", "/login", "/signup", "/workspace"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
