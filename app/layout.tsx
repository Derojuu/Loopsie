import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { fontVariables } from "@/lib/fonts";
import { structuredData } from "@/lib/structured-data";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, THEME_COLOR } from "@/constants/site";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { Loader } from "@/components/layout/loader";
import { cn } from "@/utils/cn";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    site: "@loopsiiapp",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  themeColor: THEME_COLOR,
};

/**
 * Marks back/forward and in-site navigations so the loader is skipped (runs before first paint).
 * Unlike the original, a plain refresh replays the loader so it can be reviewed; `?loader=0` skips it.
 */
const REPEAT_VISIT_SCRIPT = `(function(){var t=performance.getEntriesByType('navigation')[0],y=t&&t.type,q=location.search;if(/[?&]loader=0/.test(q)||(y!=='reload'&&(y==='back_forward'||document.referrer.indexOf(location.origin+'/')===0)))document.documentElement.classList.add('is-repeat')})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn(fontVariables, "is-loading")} suppressHydrationWarning>
      <body>
        <Script id="repeat-visit" strategy="beforeInteractive">
          {REPEAT_VISIT_SCRIPT}
        </Script>
        <Loader />
        <script
          type="application/ld+json"
          // JSON-LD must be emitted as raw script content.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
