import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";
import { Analytics as SiteAnalytics } from "@/components/seo/Analytics";
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

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "VisaInterview - Practice Your Visa Interview with AI",
    template: "%s | VisaInterview",
  },
  description:
    "Practice visa interview questions with an AI visa interview simulator built for F1, tourist, UK, Canada, Schengen, and Australia visa preparation.",
  applicationName: "VisaInterview",
  keywords: [
    "visa interview questions",
    "how to prepare for visa interview",
    "US F1 visa interview questions",
    "visa interview practice",
    "visa interview mock practice",
    "visa interview simulator AI",
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "VisaInterview",
    title: "VisaInterview - Practice Your Visa Interview with AI",
    description:
      "Practice realistic visa interview questions with AI feedback before your embassy or consulate appointment.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "VisaInterview visa interview simulator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VisaInterview - Practice Your Visa Interview with AI",
    description:
      "Practice realistic visa interview questions with AI feedback before your embassy or consulate appointment.",
    images: ["/og-default.png"],
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
