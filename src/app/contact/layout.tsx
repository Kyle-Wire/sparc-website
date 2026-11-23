import type { Metadata } from "next";
import { withPage } from "@/lib/seo";

// The contact page is a client component, so its title lives here. Before
// this it showed the home page's title in the tab and in search results.
export const metadata: Metadata = withPage("/contact", {
  title: "Contact",
  description: "Ask SPARC Labs for a flood and heat report for a place, or ask anything else. One person reads this inbox.",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
