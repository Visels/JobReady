import { getCanonicalUrl, getSiteUrl } from "@/lib/seo";

const DEFAULT_SITE_NAME = "VisaInterview";
const DEFAULT_DESCRIPTION =
  "AI-powered visa interview simulator for realistic mock interview practice.";

function siteName() {
  return process.env.NEXT_PUBLIC_SITE_NAME ?? DEFAULT_SITE_NAME;
}

function appDescription() {
  return process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? DEFAULT_DESCRIPTION;
}

function absoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, getSiteUrl()).toString();
}

function organizationSchema(): Record<string, unknown> {
  const logoUrl =
    process.env.NEXT_PUBLIC_ORGANIZATION_LOGO_URL ?? absoluteUrl("/og-default.png");

  return {
    "@type": "Organization",
    name: siteName(),
    url: getSiteUrl(),
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
    },
  };
}

export function generateWebSiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName(),
    url: getCanonicalUrl("/"),
    description: appDescription(),
  };
}

export function generateWebPageSchema({
  title,
  description,
  slug,
  datePublished,
  dateModified,
  author,
  reviewer,
  sources,
}: {
  title: string;
  description: string;
  slug: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  reviewer?: string;
  sources?: ReadonlyArray<{ label: string; href: string }>;
}): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    headline: title,
    description,
    url: getCanonicalUrl(slug),
    datePublished,
    dateModified,
    isPartOf: {
      "@type": "WebSite",
      name: siteName(),
      url: getCanonicalUrl("/"),
    },
    publisher: organizationSchema(),
  };

  if (author) {
    schema.author = {
      "@type": "Organization",
      name: author,
    };
  }

  if (reviewer) {
    schema.reviewedBy = {
      "@type": "Organization",
      name: reviewer,
    };
  }

  if (sources?.length) {
    schema.citation = sources.map((source) => ({
      "@type": "CreativeWork",
      name: source.label,
      url: source.href,
    }));
  }

  return schema;
}

export function generateFAQSchema(
  faqs: ReadonlyArray<{ question: string; answer: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateArticleSchema({
  title,
  description,
  slug,
  publishedAt,
  updatedAt,
  imageUrl,
}: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  imageUrl: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: getCanonicalUrl(slug),
    datePublished: publishedAt,
    dateModified: updatedAt ?? publishedAt,
    image: [absoluteUrl(imageUrl)],
    author: organizationSchema(),
    publisher: organizationSchema(),
  };
}

export function generateSoftwareAppSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteName(),
    url: getCanonicalUrl("/"),
    description: appDescription(),
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: process.env.NEXT_PUBLIC_APP_FREE_PRICE ?? "0",
      priceCurrency: process.env.NEXT_PUBLIC_APP_PRICE_CURRENCY ?? "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: process.env.NEXT_PUBLIC_APP_RATING_VALUE ?? "4.8",
      ratingCount: process.env.NEXT_PUBLIC_APP_RATING_COUNT ?? "127",
    },
    publisher: organizationSchema(),
  };
}

export function generateBreadcrumbSchema(
  items: ReadonlyArray<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}
