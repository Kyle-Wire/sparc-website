import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";
import { MODEL_PAGES } from "@/lib/model-pages";

// The public pages a search engine may list. Keep this to pages that are
// indexable (no robots noindex) and true today; robots.ts keeps the rest out.
const PAGES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/map", priority: 0.9, changeFrequency: "weekly" },
  { path: "/storm-ahead", priority: 0.7, changeFrequency: "monthly" },
  { path: "/acorn", priority: 0.4, changeFrequency: "monthly" },
  { path: "/report/sample", priority: 0.8, changeFrequency: "weekly" },
  { path: "/example", priority: 0.8, changeFrequency: "monthly" },
  { path: "/models", priority: 0.7, changeFrequency: "monthly" },
  ...MODEL_PAGES.map((m) => ({ path: `/models/${m.slug}`, priority: 0.6, changeFrequency: "monthly" as const })),
  { path: "/how-we-test", priority: 0.3, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/next-steps", priority: 0.5, changeFrequency: "monthly" },
  { path: "/data", priority: 0.5, changeFrequency: "monthly" },
  { path: "/glossary", priority: 0.5, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
  { path: "/data-use", priority: 0.3, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({ url: `${SITE_URL}${p.path === "/" ? "" : p.path}`, changeFrequency: p.changeFrequency, priority: p.priority }));
}
