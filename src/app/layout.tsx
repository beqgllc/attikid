import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const siteUrl = "https://attikid.com";
const siteDescription =
  "Discover Attikid: independent music, emotionally honest hip-hop, albums and songs, plus free songwriting and music-creation tools in Attikid Studio.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Attikid | Independent Music, Albums & Songwriting Tools",
    template: "%s | Attikid",
  },
  description: siteDescription,
  applicationName: "Attikid",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Attikid",
    title: "Attikid | Independent Music, Albums & Songwriting Tools",
    description: siteDescription,
    images: [
      {
        url: "/images/albums/misery-motel-cover-artwork.webp",
        width: 1200,
        height: 630,
        alt: "Attikid — Same Kid, Different Demons",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Attikid | Independent Music, Albums & Songwriting Tools",
    description: siteDescription,
    images: ["/images/albums/misery-motel-cover-artwork.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "music",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="ak-skip-link" href="#main-content">Skip to main content</a>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
