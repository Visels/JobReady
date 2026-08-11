import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { Analytics as SiteAnalytics } from "@/components/seo/Analytics";
import { publicProductConfig } from "@/config/public";
import { getSiteUrl } from "@/lib/site-url";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "Jiandae - Prepare for job interviews with realistic company and role practice for African careers, Kenyan candidates, and regional hiring teams.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Jiandae - Interview Preparation for African Careers",
    template: "%s | Jiandae",
  },
  description: siteDescription,
  applicationName: publicProductConfig.brand.name,
  keywords: [
    "interview preparation Africa",
    "job interview practice Kenya",
    "African companies job interviews",
    "Kenyan interview questions",
    "company interview preparation",
    "STAR interview practice Africa",
  ],
  icons: {
    icon: publicProductConfig.brand.assets.favicon,
    shortcut: publicProductConfig.brand.assets.favicon,
  },
  openGraph: {
    type: "website",
    siteName: publicProductConfig.brand.name,
    title: "Jiandae - Interview Preparation for African Careers",
    description: siteDescription,
    images: [
      {
        url: publicProductConfig.brand.assets.socialOg,
        width: 1200,
        height: 630,
        alt: "Jiandae social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jiandae - Interview Preparation for African Careers",
    description: siteDescription,
    images: [publicProductConfig.brand.assets.socialOg],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? {
        google: process.env.GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteAnalytics />
        <Providers>{children}</Providers>
        <VercelAnalytics />
      </body>
    </html>
  );
}
