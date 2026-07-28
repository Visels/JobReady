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

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Jobready - Jobs, CV Tailoring, and Interview Practice in Africa",
    template: "%s | Jobready",
  },
  description:
    "Find sourced jobs, tailor truthful CVs and resumes, and practise realistic company and role interviews for African careers.",
  applicationName: publicProductConfig.brand.name,
  keywords: [
    "jobs in Kenya",
    "Africa jobs",
    "CV tailoring Kenya",
    "resume tailoring Africa",
    "job interview practice Kenya",
    "STAR interview practice",
  ],
  icons: {
    icon: publicProductConfig.brand.assets.favicon,
    shortcut: publicProductConfig.brand.assets.favicon,
  },
  openGraph: {
    type: "website",
    siteName: publicProductConfig.brand.name,
    title: "Jobready - Jobs, CV Tailoring, and Interview Practice in Africa",
    description:
      "Fresh sourced jobs, truthful CV tailoring, and realistic mock interviews built for African careers.",
    images: [
      {
        url: publicProductConfig.brand.assets.socialOg,
        width: 1200,
        height: 630,
        alt: "Jobready social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jobready - Jobs, CV Tailoring, and Interview Practice in Africa",
    description:
      "Fresh sourced jobs, truthful CV tailoring, and realistic mock interviews built for African careers.",
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
