import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../styles/globals.css";
import "../styles/cabinet.css";
import { COMPANY, SITE_TITLE, TAGLINE_LONG, SITE_URL } from "@/lib/brand";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Mist />
        {children}
        <CookieNotice />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
