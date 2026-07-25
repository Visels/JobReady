import type { Metadata } from "next";
import {
  getAbsoluteUrl,
  getCanonicalUrl as buildCanonicalUrl,
  getSiteUrl as resolveSiteUrl,
} from "@/lib/site-url";
import { publicProductConfig } from "@/config/public";

type ArticleSEO = {
  publishedAt: string;
  updatedAt?: string;
  authors: string[];
  tags: string[];
};

type OgImageParams = {
  title: string;
  sub?: string;
  badge?: string;
};

type SEOInput = {
  title: string;
  description: string;
  slug: string;
  ogImage?: string;
  ogImageParams?: OgImageParams;
  noIndex?: boolean;
  keywords?: string[];
  article?: ArticleSEO;
};

const SITE_NAME = publicProductConfig.brand.name;

function buildOgImageUrl({
  ogImage,
  ogImageParams,
}: {
  ogImage: string;
  ogImageParams?: OgImageParams;
}) {
  if (!ogImageParams) return getAbsoluteUrl(ogImage);

  const url = new URL("/og", `${resolveSiteUrl()}/`);
  url.searchParams.set("title", ogImageParams.title);

  if (ogImageParams.sub) {
    url.searchParams.set("sub", ogImageParams.sub);
  }

  if (ogImageParams.badge) {
    url.searchParams.set("badge", ogImageParams.badge);
  }

  return url;
}

export function generateSEO({
  title,
  description,
  slug,
  ogImage = "/og-default.png",
  ogImageParams,
  noIndex = false,
  keywords = [],
  article,
}: SEOInput): Metadata {
  const canonical = buildCanonicalUrl(slug);
  const ogImageUrl = buildOgImageUrl({ ogImage, ogImageParams });
  const fullTitle = `${title} | ${SITE_NAME}`;

  const robots: Metadata["robots"] = noIndex
    ? {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
          "max-video-preview": 0,
          "max-image-preview": "none",
          "max-snippet": 0,
        },
      }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      };

  const openGraph: Metadata["openGraph"] = article
    ? {
        type: "article",
        title: fullTitle,
        description,
        url: canonical,
        siteName: SITE_NAME,
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt ?? article.publishedAt,
        authors: article.authors,
        tags: article.tags,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }
    : {
        type: "website",
        title: fullTitle,
        description,
        url: canonical,
        siteName: SITE_NAME,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      };

  return {
    metadataBase: new URL(resolveSiteUrl()),
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImageUrl],
    },
    robots,
    authors: article?.authors.map((name) => ({ name })),
  };
}

export function getCanonicalUrl(slug: string) {
  return buildCanonicalUrl(slug);
}

export function getSiteUrl() {
  return resolveSiteUrl();
}
