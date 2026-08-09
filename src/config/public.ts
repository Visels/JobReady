export type ProductFeatureFlag =
  | "legacyVisaFlow"
  | "publicJobs"
  | "cvResumeTailoring"
  | "jobInterviews"
  | "applicationTracking"
  | "nativeApplications";

export type ProductFeatureFlags = Record<ProductFeatureFlag, boolean>;

export type PublicProductEnv = Partial<{
  NEXT_PUBLIC_APP_URL: string;
  NEXT_PUBLIC_JOBREADY_CANONICAL_HOST: string;
  NEXT_PUBLIC_JOBREADY_BRAND_NAME: string;
  NEXT_PUBLIC_JOBREADY_WORDMARK_TEXT: string;
  NEXT_PUBLIC_JOBREADY_LEGAL_NAME: string;
  NEXT_PUBLIC_JOBREADY_SUPPORT_EMAIL: string;
  NEXT_PUBLIC_JOBREADY_DEFAULT_MARKET: string;
  NEXT_PUBLIC_JOBREADY_X_HANDLE: string;
  NEXT_PUBLIC_JOBREADY_LINKEDIN_URL: string;
  NEXT_PUBLIC_JOBREADY_FACEBOOK_URL: string;
  NEXT_PUBLIC_JOBREADY_INSTAGRAM_URL: string;
  NEXT_PUBLIC_FEATURE_LEGACY_VISA_FLOW: string;
  NEXT_PUBLIC_FEATURE_PUBLIC_JOBS: string;
  NEXT_PUBLIC_FEATURE_CV_RESUME_TAILORING: string;
  NEXT_PUBLIC_FEATURE_JOB_INTERVIEWS: string;
  NEXT_PUBLIC_FEATURE_APPLICATION_TRACKING: string;
  NEXT_PUBLIC_FEATURE_NATIVE_APPLICATIONS: string;
}>;

export type PublicProductConfig = {
  brand: {
    name: string;
    wordmarkText: string;
    legacyName: string;
    assets: {
      wordmark: string;
      wordmarkLight: string;
      wordmarkDark: string;
      compactMark: string;
      favicon: string;
      socialOg: string;
    };
  };
  canonical: {
    hostname: string;
    apexHostname: string;
    url: string;
  };
  legal: {
    legalName: string;
    supportEmail: string;
  };
  market: {
    defaultCountryCode: string;
  };
  social: {
    xHandle: string;
    linkedinUrl: string;
    facebookUrl: string;
    instagramUrl: string;
  };
  features: ProductFeatureFlags;
};

const DEFAULT_CANONICAL_HOSTNAME = "www.jiandae.co.ke";
const DEFAULT_LEGAL_NAME = "Exelient Technologies";
const DEFAULT_SUPPORT_EMAIL = "support@jiandae.co.ke";

const publicEnv: PublicProductEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_JOBREADY_CANONICAL_HOST:
    process.env.NEXT_PUBLIC_JOBREADY_CANONICAL_HOST,
  NEXT_PUBLIC_JOBREADY_BRAND_NAME:
    process.env.NEXT_PUBLIC_JOBREADY_BRAND_NAME,
  NEXT_PUBLIC_JOBREADY_WORDMARK_TEXT:
    process.env.NEXT_PUBLIC_JOBREADY_WORDMARK_TEXT,
  NEXT_PUBLIC_JOBREADY_LEGAL_NAME:
    process.env.NEXT_PUBLIC_JOBREADY_LEGAL_NAME,
  NEXT_PUBLIC_JOBREADY_SUPPORT_EMAIL:
    process.env.NEXT_PUBLIC_JOBREADY_SUPPORT_EMAIL,
  NEXT_PUBLIC_JOBREADY_DEFAULT_MARKET:
    process.env.NEXT_PUBLIC_JOBREADY_DEFAULT_MARKET,
  NEXT_PUBLIC_JOBREADY_X_HANDLE: process.env.NEXT_PUBLIC_JOBREADY_X_HANDLE,
  NEXT_PUBLIC_JOBREADY_LINKEDIN_URL:
    process.env.NEXT_PUBLIC_JOBREADY_LINKEDIN_URL,
  NEXT_PUBLIC_JOBREADY_FACEBOOK_URL:
    process.env.NEXT_PUBLIC_JOBREADY_FACEBOOK_URL,
  NEXT_PUBLIC_JOBREADY_INSTAGRAM_URL:
    process.env.NEXT_PUBLIC_JOBREADY_INSTAGRAM_URL,
  NEXT_PUBLIC_FEATURE_LEGACY_VISA_FLOW:
    process.env.NEXT_PUBLIC_FEATURE_LEGACY_VISA_FLOW,
  NEXT_PUBLIC_FEATURE_PUBLIC_JOBS: process.env.NEXT_PUBLIC_FEATURE_PUBLIC_JOBS,
  NEXT_PUBLIC_FEATURE_CV_RESUME_TAILORING:
    process.env.NEXT_PUBLIC_FEATURE_CV_RESUME_TAILORING,
  NEXT_PUBLIC_FEATURE_JOB_INTERVIEWS:
    process.env.NEXT_PUBLIC_FEATURE_JOB_INTERVIEWS,
  NEXT_PUBLIC_FEATURE_APPLICATION_TRACKING:
    process.env.NEXT_PUBLIC_FEATURE_APPLICATION_TRACKING,
  NEXT_PUBLIC_FEATURE_NATIVE_APPLICATIONS:
    process.env.NEXT_PUBLIC_FEATURE_NATIVE_APPLICATIONS,
};

function stringValue(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function normalizeHostname(value: string | undefined, fallback: string) {
  const raw = stringValue(value, fallback)
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/^\[|\]$/g, "")
    .toLowerCase();

  return raw || fallback;
}

function apexHostname(hostname: string) {
  return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
}

export function parseFeatureFlag(
  value: string | undefined,
  defaultValue: boolean,
) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) return defaultValue;
  if (["1", "true", "yes", "y", "on", "enabled"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "n", "off", "disabled"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

export function buildPublicProductConfig(
  env: PublicProductEnv = publicEnv,
): PublicProductConfig {
  const hostname = normalizeHostname(
    env.NEXT_PUBLIC_JOBREADY_CANONICAL_HOST,
    DEFAULT_CANONICAL_HOSTNAME,
  );

  return {
    brand: {
      name: stringValue(env.NEXT_PUBLIC_JOBREADY_BRAND_NAME, "Jiandae"),
      wordmarkText: stringValue(
        env.NEXT_PUBLIC_JOBREADY_WORDMARK_TEXT,
        "jiandae",
      ),
      legacyName: "VisaInterview",
      assets: {
        wordmark: "/brand/jiandae/wordmark.png",
        wordmarkLight: "/brand/jiandae/wordmark.png",
        wordmarkDark: "/brand/jiandae/wordmark-reversed.png",
        compactMark: "/brand/jiandae/compact-mark.png",
        favicon: "/brand/jiandae/favicon.png",
        socialOg: "/brand/jiandae/social-og.png",
      },
    },
    canonical: {
      hostname,
      apexHostname: apexHostname(hostname),
      url: `https://${hostname}`,
    },
    legal: {
      legalName: stringValue(
        env.NEXT_PUBLIC_JOBREADY_LEGAL_NAME,
        DEFAULT_LEGAL_NAME,
      ),
      supportEmail: stringValue(
        env.NEXT_PUBLIC_JOBREADY_SUPPORT_EMAIL,
        DEFAULT_SUPPORT_EMAIL,
      ),
    },
    market: {
      defaultCountryCode: stringValue(
        env.NEXT_PUBLIC_JOBREADY_DEFAULT_MARKET,
        "KE",
      ).toUpperCase(),
    },
    social: {
      xHandle: stringValue(env.NEXT_PUBLIC_JOBREADY_X_HANDLE, ""),
      linkedinUrl: stringValue(env.NEXT_PUBLIC_JOBREADY_LINKEDIN_URL, ""),
      facebookUrl: stringValue(env.NEXT_PUBLIC_JOBREADY_FACEBOOK_URL, ""),
      instagramUrl: stringValue(env.NEXT_PUBLIC_JOBREADY_INSTAGRAM_URL, ""),
    },
    features: {
      legacyVisaFlow: parseFeatureFlag(
        env.NEXT_PUBLIC_FEATURE_LEGACY_VISA_FLOW,
        true,
      ),
      publicJobs: parseFeatureFlag(env.NEXT_PUBLIC_FEATURE_PUBLIC_JOBS, false),
      cvResumeTailoring: parseFeatureFlag(
        env.NEXT_PUBLIC_FEATURE_CV_RESUME_TAILORING,
        false,
      ),
      jobInterviews: parseFeatureFlag(
        env.NEXT_PUBLIC_FEATURE_JOB_INTERVIEWS,
        false,
      ),
      applicationTracking: parseFeatureFlag(
        env.NEXT_PUBLIC_FEATURE_APPLICATION_TRACKING,
        false,
      ),
      nativeApplications: parseFeatureFlag(
        env.NEXT_PUBLIC_FEATURE_NATIVE_APPLICATIONS,
        false,
      ),
    },
  };
}

export const publicProductConfig = buildPublicProductConfig(publicEnv);

export function isFeatureEnabled(feature: ProductFeatureFlag) {
  return publicProductConfig.features[feature];
}
