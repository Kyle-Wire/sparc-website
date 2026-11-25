import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../styles/globals.css";
import "../styles/cabinet.css";
import "../styles/quiet.css";
import "../styles/brand.css";
import "../styles/models.css";
import { COMPANY, COMPANY_LEGAL, EMAIL_PRIMARY, OFFICE_CITY, OFFICE_STATE, SITE_TITLE, TAGLINE_LONG, SITE_URL } from "@/lib/brand";
import { CookieNotice } from "@/components/shell/CookieNotice";
import { Mist } from "@/components/system/Mist";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${COMPANY} · ${SITE_TITLE}`,
    template: `%s · ${COMPANY}`,
  },
  description: TAGLINE_LONG,
  openGraph: {
    title: `${COMPANY} · ${SITE_TITLE}`,
    description: TAGLINE_LONG,
    url: SITE_URL,
    siteName: COMPANY,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${COMPANY} · ${SITE_TITLE}`,
    description: TAGLINE_LONG,
  },
};

// Who runs the site, for search engines: only facts already on the site
// (the footer and /about). No ratings, prices or claims go in here.
const ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: COMPANY,
  legalName: COMPANY_LEGAL,
  url: SITE_URL,
  logo: `${SITE_URL}/sparclabs-logo.png`,
  email: EMAIL_PRIMARY,
  address: { "@type": "PostalAddress", addressLocality: OFFICE_CITY, addressRegion: OFFICE_STATE, addressCountry: "US" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION) }} />
        <Mist />
        {children}
        <CookieNotice />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
