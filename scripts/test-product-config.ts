import { strict as assert } from "node:assert";
import {
  buildPublicProductConfig,
  parseFeatureFlag,
} from "../src/config/public";
import { validateRequiredProductionConfig } from "../src/config/server";
import { resolveSiteUrl } from "../src/lib/site-url";

function relativeLuminance(hex: string) {
  const channels = hex
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((value) => Number.parseInt(value, 16) / 255);

  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid color: ${hex}`);
  }

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);

  return (lighter + 0.05) / (darker + 0.05);
}

assert.equal(parseFeatureFlag("true", false), true);
assert.equal(parseFeatureFlag("0", true), false);
assert.equal(parseFeatureFlag("unexpected", true), true);

const config = buildPublicProductConfig({
  NEXT_PUBLIC_APP_URL: "https://preview.example.com",
  NEXT_PUBLIC_JIANDAE_CANONICAL_HOST: "www.jiandae.test",
  NEXT_PUBLIC_FEATURE_LEGACY_VISA_FLOW: "true",
  NEXT_PUBLIC_FEATURE_PUBLIC_JOBS: "enabled",
  NEXT_PUBLIC_FEATURE_NATIVE_APPLICATIONS: "off",
});

assert.equal(config.brand.wordmarkText, "jiandae");
assert.equal(config.canonical.hostname, "www.jiandae.test");
assert.equal(config.canonical.apexHostname, "jiandae.test");
assert.equal(config.canonical.url, "https://www.jiandae.test");
assert.equal(config.market.defaultCountryCode, "KE");
assert.equal(config.features.legacyVisaFlow, true);
assert.equal(config.features.publicJobs, true);
assert.equal(config.features.nativeApplications, false);

const defaultConfig = buildPublicProductConfig({
  NEXT_PUBLIC_APP_URL: "https://www.visainterview.ai",
});

assert.equal(defaultConfig.canonical.hostname, "jiandae.africa");
assert.equal(defaultConfig.legal.supportEmail, "support@jiandae.africa");

assert.equal(
  resolveSiteUrl(
    {
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_JIANDAE_CANONICAL_HOST: "www.jiandae.test",
    },
    "development",
  ),
  "http://localhost:3000",
);
assert.equal(
  resolveSiteUrl(
    {
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_JIANDAE_CANONICAL_HOST: "www.jiandae.test",
    },
    "production",
  ),
  "https://www.jiandae.test",
);
assert.equal(
  resolveSiteUrl(
    {
      NEXT_PUBLIC_APP_URL: "https://staging.example.com",
      NEXT_PUBLIC_JIANDAE_CANONICAL_HOST: "www.jiandae.test",
    },
    "production",
  ),
  "https://staging.example.com",
);

assert.throws(
  () => validateRequiredProductionConfig({ NODE_ENV: "production" }),
  /Missing required production Jiandae configuration/,
);
validateRequiredProductionConfig({
  NODE_ENV: "production",
  NEXT_PUBLIC_APP_URL: "https://www.jiandae.test",
  NEXT_PUBLIC_JIANDAE_CANONICAL_HOST: "www.jiandae.test",
});

assert.ok(contrastRatio("#1B2430", "#FCFCFA") >= 4.5);
assert.ok(contrastRatio("#00533A", "#FCFCFA") >= 4.5);
assert.ok(contrastRatio("#FFFFFF", "#00533A") >= 4.5);
assert.ok(contrastRatio("#1B2430", "#D8A12E") >= 4.5);
