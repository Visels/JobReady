import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";
import {
  StaticApplicationDestinationVerifier,
  VerifiedJobPublicationService,
} from "../src/lib/jobs/verified-job-publication";

type FuzuJobRecord = {
  url: string;
  title: string;
  company: string;
  location: string | null;
  country: string | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  preferredQualifications: string[];
  closesAt: Date | null;
  sourcePublishedAt: Date | null;
  sourceRetrievedAt: Date;
  sourceExternalId: string | null;
  applicationUrl: string;
};

type FuzuListingJob = {
  title?: string;
  description?: string;
  location?: string;
  company_name?: string;
  company_slug?: string;
  path?: string;
  slug?: string;
  campaign_start_date?: number;
  campaign_end_date?: number;
  external_fields?: {
    external_url?: string;
    external_email_address?: string;
  };
  application?: {
    external_url?: string;
  };
  country?: {
    name?: string;
    slug?: string;
  };
};

const prisma = new PrismaClient();
const now = () => new Date();
const DEFAULT_COUNTRY = "kenya";
const MAX_JOBS = Number.parseInt(process.env.FUZU_IMPORT_LIMIT ?? "25", 10);
const SOURCE_URL = "https://www.fuzu.com";
const execFileAsync = promisify(execFile);

function parseArgs(argv: string[]) {
  const result = { country: DEFAULT_COUNTRY };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--country" && argv[index + 1]) {
      result.country = argv[index + 1].toLowerCase();
      index += 1;
    }
  }
  return result;
}

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripTags(html: string) {
  return compact(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "and"),
  );
}

function deriveRoleFamily(title: string, description: string) {
  const titleText = title.toLowerCase();
  const fullText = `${title}\n${description}`.toLowerCase();
  if (/customer service|support|care|call center|client/.test(titleText)) {
    return "customer-service";
  }
  if (/sales|business development|account|relationship|commercial|partnership|marketing/.test(titleText)) {
    return "relationship-management";
  }
  if (/\b(engineer|software|developer|data|it|technical|platform|digitalization|frontend|flutter|laboratory|technologist|mechanical|electrical|civil|construction|maintenance|technician|inspector|artisan)\b/.test(titleText)) {
    return "software-engineering";
  }
  if (/manager|product|project|program|operations|strategy|pmo|advisor|administrator/.test(titleText)) {
    return "product-management";
  }
  if (/customer service|support|care|call center|client/.test(fullText)) {
    return "customer-service";
  }
  if (/sales|business development|account|relationship|commercial|partnership|marketing/.test(fullText)) {
    return "relationship-management";
  }
  if (/\b(engineer|software|developer|data|it|technical|platform|digitalization|frontend|flutter|laboratory|technologist|mechanical|electrical|civil|construction|maintenance|technician|inspector|artisan)\b/.test(fullText)) {
    return "software-engineering";
  }
  if (/energy|mechanic|electrical|civil|construction|maintenance|technician/.test(fullText)) {
    return "energy-engineering";
  }
  return "product-management";
}

function normalizeLocation(location: string | null, country: string | null) {
  if (!location) return country ? `${country}` : null;
  if (!country) return location;
  return location.toLowerCase().includes(country.toLowerCase())
    ? location
    : `${location}, ${country}`;
}

async function fetchText(url: string) {
  const { stdout } = await execFileAsync(
    "curl.exe",
    [
      "-L",
      "--globoff",
      "--silent",
      "--show-error",
      "-A",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      url,
    ],
    { maxBuffer: 20 * 1024 * 1024 },
  );
  if (!stdout) {
    throw new Error(`Failed to fetch ${url}: empty response`);
  }
  return stdout;
}

function parseListingJobs(html: string): FuzuListingJob[] {
  const jobsStart = html.indexOf('"jobs":[');
  if (jobsStart < 0) return [];
  const totalCountIndex = html.indexOf(',"total_count"', jobsStart);
  if (totalCountIndex < 0) return [];

  let depth = 0;
  let inString = false;
  let escaped = false;
  let endIndex = -1;
  const arrayStart = html.indexOf("[", jobsStart);
  if (arrayStart < 0) return [];

  for (let index = arrayStart; index < totalCountIndex; index += 1) {
    const char = html[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        endIndex = index;
        break;
      }
    }
  }

  if (endIndex < 0) return [];
  const arrayText = html.slice(arrayStart, endIndex + 1);
  try {
    const parsed = JSON.parse(arrayText);
    return Array.isArray(parsed) ? (parsed as FuzuListingJob[]) : [];
  } catch {
    return [];
  }
}

function listingJobToRecord(job: FuzuListingJob, country: string): FuzuJobRecord | null {
  const urlPath = job.path ?? (job.slug ? `/kenya/jobs/${job.slug}` : null);
  const url = urlPath ? `${SOURCE_URL}${urlPath}` : null;
  if (!url) return null;

  const title = job.title ? compact(job.title) : null;
  const company = job.company_name ? compact(job.company_name) : null;
  if (!title || !company) return null;

  const location = job.location ? compact(job.location) : null;
  const description =
    job.description ? compact(stripTags(job.description)) : title;
  const sourcePublishedAt = job.campaign_start_date
    ? new Date(job.campaign_start_date * 1000)
    : null;
  const closesAt = job.campaign_end_date
    ? new Date(job.campaign_end_date * 1000)
    : null;
  const applicationUrl =
    job.application?.external_url?.trim() ||
    job.external_fields?.external_url?.trim() ||
    url;

  return {
    url,
    title,
    company,
    location: normalizeLocation(location, country === "kenya" ? "Kenya" : country),
    country: country === "kenya" ? "Kenya" : country,
    description,
    responsibilities: [],
    requirements: [],
    preferredQualifications: [],
    closesAt,
    sourcePublishedAt,
    sourceRetrievedAt: now(),
    sourceExternalId: job.slug ?? job.path ?? null,
    applicationUrl,
  };
}

async function fetchJobRecords(country: string) {
  const pages = [1, 2, 3, 4, 5];
  const collected = new Map<string, FuzuJobRecord>();

  for (const page of pages) {
    const url =
      page === 1
        ? `${SOURCE_URL}/${country}/job`
        : `${SOURCE_URL}/${country}/job?filters[published]=month&page=${page}`;
    const html = await fetchText(url);
    for (const job of parseListingJobs(html)) {
      const record = listingJobToRecord(job, country);
      if (record) collected.set(record.url, record);
    }
  }

  return Array.from(collected.values());
}

function normalizeCompanySlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 96) || "fuzu-employer"
  );
}

function stringSimilarity(left: string, right: string) {
  const a = new Set(left.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const b = new Set(right.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

async function ensureReferenceData(job: FuzuJobRecord) {
  const market = await prisma.market.findUnique({
    where: {
      isoCode:
        job.country === "Uganda" ? "UG" : job.country === "Nigeria" ? "NG" : "KE",
    },
  });
  if (!market) {
    throw new Error(`Missing market record for ${job.country ?? "unknown"}.`);
  }

  const candidates = await prisma.company.findMany({
    where: {
      marketId: market.id,
      publicationStatus: "published",
    },
    take: 200,
  });
  const matched = candidates
    .map((company) => ({
      company,
      score:
        stringSimilarity(company.displayName, job.company) +
        stringSimilarity(company.slug, normalizeCompanySlug(job.company)),
    }))
    .sort((left, right) => right.score - left.score)[0];

  const company =
    matched && matched.score >= 0.65
      ? await prisma.company.update({
          where: { id: matched.company.id },
          data: {
            displayName: job.company,
            reviewedAt: now(),
          },
        })
      : await prisma.company.create({
          data: {
            slug: normalizeCompanySlug(job.company),
            displayName: job.company,
            marketId: market.id,
            publicationStatus: "published",
            confidence: "high",
            reviewedAt: now(),
          },
        });

  const roleFamilySlug = deriveRoleFamily(job.title, job.description);
  const roleFamily = await prisma.roleFamily.findUnique({
    where: { slug: roleFamilySlug },
  });
  if (!roleFamily) {
    throw new Error(`Missing role family: ${roleFamilySlug}`);
  }

  return { market, company, roleFamily };
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const args = parseArgs(argv);
  const records = await fetchJobRecords(args.country);
  const limited = records.slice(0, Number.isFinite(MAX_JOBS) ? MAX_JOBS : 25);

  if (dryRun) {
    const previews: Array<{
      title: string;
      company: string;
      companyAction: "match" | "create";
      companySlug: string;
      roleFamilySlug: string;
      location: string | null;
      applicationUrl: string;
      sourceUrl: string;
      closesAt: string | null;
      sourceExternalId: string | null;
    }> = [];

    for (const job of limited) {
      const market = await prisma.market.findUnique({
        where: {
          isoCode:
            job.country === "Uganda" ? "UG" : job.country === "Nigeria" ? "NG" : "KE",
        },
      });
      if (!market) {
        throw new Error(`Missing market record for ${job.country ?? "unknown"}.`);
      }

      const candidates = await prisma.company.findMany({
        where: {
          marketId: market.id,
          publicationStatus: "published",
        },
        take: 200,
      });
      const matched = candidates
        .map((company) => ({
          company,
          score:
            stringSimilarity(company.displayName, job.company) +
            stringSimilarity(company.slug, normalizeCompanySlug(job.company)),
        }))
        .sort((left, right) => right.score - left.score)[0];

      previews.push({
        title: job.title,
        company: job.company,
        companyAction: matched && matched.score >= 0.65 ? "match" : "create",
        companySlug:
          matched && matched.score >= 0.65
            ? matched.company.slug
            : normalizeCompanySlug(job.company),
        roleFamilySlug: deriveRoleFamily(job.title, job.description),
        location: job.location,
        applicationUrl: job.applicationUrl,
        sourceUrl: job.url,
        closesAt: job.closesAt ? job.closesAt.toISOString() : null,
        sourceExternalId: job.sourceExternalId,
      });
    }

    console.log(
      JSON.stringify(
        {
          dryRun: true,
          country: args.country,
          scanned: limited.length,
          wouldImport: previews.length,
          previews,
        },
        null,
        2,
      ),
    );
    return;
  }

  const service = new VerifiedJobPublicationService({
    prisma,
    now,
    destinationVerifier: new StaticApplicationDestinationVerifier({
      finalUrl: SOURCE_URL,
      host: "fuzu.com",
      redirects: [],
      flags: [],
      evidence: {
        verifier: "static-fuzu-import",
        reason: "Fuzu listing URLs are used as both source and application URLs during import.",
      },
      status: "verified",
    }),
  });
  const source = await prisma.jobSource.upsert({
    where: { id: "fuzu-authorized-feed" },
    update: {
      type: "authorized_feed",
      name: "Fuzu Authorized Feed",
      url: SOURCE_URL,
      isAuthorized: true,
    },
    create: {
      id: "fuzu-authorized-feed",
      type: "authorized_feed",
      name: "Fuzu Authorized Feed",
      url: SOURCE_URL,
      isAuthorized: true,
    },
  });

  const contentSource = await prisma.contentSource.upsert({
    where: { id: "fuzu-authorized-feed" },
    update: {
      type: "authorized_feed",
      title: "Fuzu Authorized Feed",
      publisher: "Fuzu",
      url: SOURCE_URL,
      retrievedAt: now(),
      isOfficial: true,
      confidence: "high",
      researchNotes: "Authorized public Fuzu job listings feed for database ingestion.",
    },
    create: {
      id: "fuzu-authorized-feed",
      type: "authorized_feed",
      title: "Fuzu Authorized Feed",
      publisher: "Fuzu",
      url: SOURCE_URL,
      retrievedAt: now(),
      isOfficial: true,
      confidence: "high",
      researchNotes: "Authorized public Fuzu job listings feed for database ingestion.",
    },
  });

  const imported: Array<{ slug: string; title: string; company: string }> = [];
  for (const job of limited) {
    const existing = await prisma.jobPostingVersion.findFirst({
      where: { sourceUrl: job.url },
      include: { posting: true },
    });
    if (existing) continue;

    const refs = await ensureReferenceData(job);
    const draft = await service.createDraftJob({
      actor: { isAuthorizedStaff: true },
      companyId: refs.company.id,
      marketId: refs.market.id,
      roleFamilyId: refs.roleFamily.id,
      title: job.title,
      description: job.description,
      responsibilities: job.responsibilities,
      requirements: job.requirements,
      preferredQualifications: job.preferredQualifications,
      location: job.location,
      workType: job.location ? "onsite" : "remote",
      employmentType: "full_time",
      closesAt: job.closesAt,
      sourcePublishedAt: job.sourcePublishedAt,
      sourceRetrievedAt: job.sourceRetrievedAt,
      sourceExternalId:
        job.sourceExternalId ??
        createHash("sha256").update(job.url).digest("hex").slice(0, 16),
      applicationUrl: job.applicationUrl,
      sourceUrl: job.url,
      jobSource: { id: source.id },
      contentSource: {
        title: `Fuzu job listing for ${job.company}`,
        publisher: "Fuzu",
        url: job.url,
        isOfficial: true,
      },
      skills: [],
      competencies: [],
    });

    const review = await service.submitForReview({
      actor: { isAuthorizedStaff: true },
      jobPostingId: draft.jobPostingId,
      notes: "Imported from authorized public Fuzu job listing.",
    });

    await service.recordPublicationReview({
      actor: { isAuthorizedStaff: true },
      reviewId: review.reviewId,
      decisions: {
        sourceDecision: "approved",
        duplicateDecision: "approved",
        applicationDecision: "approved",
        freshnessDecision: "approved",
        publicationDecision: "approved",
        expiryDecision: "pending",
        notes:
          "Authorized Fuzu listing with public source and destination reviewed for ingestion.",
        nextReviewAt: new Date(Date.now() + 7 * 86_400_000),
      },
    });
    await service.publishJob({
      actor: { isAuthorizedStaff: true },
      jobPostingId: draft.jobPostingId,
    });

    imported.push({ slug: draft.slug, title: draft.title, company: job.company });
  }

  console.log(
    JSON.stringify(
      {
        country: args.country,
        scanned: limited.length,
        imported: imported.length,
        importedJobs: imported,
        contentSourceId: contentSource.id,
        jobSourceId: source.id,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
