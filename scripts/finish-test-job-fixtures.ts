import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = new Date("2026-08-21T09:30:00.000Z");
const closesAt = new Date("2026-10-31T23:59:59.000Z");

const jobs = [
  ["Customer Care Team Lead", "Pamoja Health", "customer-service", "Eldoret, Kenya"],
  ["Mechanical Maintenance Technician", "Coast Industrial Works", "energy-engineering", "Mombasa, Kenya"],
  ["Project Administrator", "Rift Valley Energy", "product-management", "Nakuru, Kenya"],
  ["Data Engineering Intern", "Nairobi Cloud Works", "software-engineering", "Hybrid, Nairobi, Kenya"],
  ["Partnerships Officer", "GreenLink Africa", "relationship-management", "Nairobi, Kenya"],
  ["QA Test Analyst", "JobReady Test Employer", "software-engineering", "Remote, Kenya"],
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function main() {
  const market = await prisma.market.findUnique({ where: { isoCode: "KE" } });
  if (!market) throw new Error("Missing KE market.");

  const source = await prisma.jobSource.upsert({
    where: { id: "jobready-fallback-test-jobs" },
    update: {
      type: "internal_fixture",
      name: "JobReady fallback test jobs",
      url: "https://www.fuzu.com/jobs",
      isAuthorized: true,
    },
    create: {
      id: "jobready-fallback-test-jobs",
      type: "internal_fixture",
      name: "JobReady fallback test jobs",
      url: "https://www.fuzu.com/jobs",
      isAuthorized: true,
    },
  });

  await prisma.jobPosting.updateMany({
    where: {
      jobSourceId: source.id,
      status: { in: ["draft", "needs_review"] },
      closesAt: { gt: now },
    },
    data: {
      status: "published",
      publishedAt: now,
      lastVerifiedAt: now,
    },
  });

  const imported: Array<{ slug: string; title: string; company: string }> = [];
  for (const [title, companyName, roleFamilySlug, location] of jobs) {
    const externalId = `jobready-test-${slugify(companyName)}-${slugify(title)}`;
    const existing = await prisma.jobPostingVersion.findFirst({
      where: { sourceExternalId: externalId },
      include: { posting: true },
    });
    if (existing) {
      if (existing.posting.status !== "published") {
        await prisma.jobPosting.update({
          where: { id: existing.posting.id },
          data: { status: "published", publishedAt: now, lastVerifiedAt: now },
        });
      }
      continue;
    }

    const [company, roleFamily] = await Promise.all([
      prisma.company.upsert({
        where: { slug: slugify(companyName) },
        update: {
          displayName: companyName,
          marketId: market.id,
          publicationStatus: "published",
          confidence: "high",
          reviewedAt: now,
        },
        create: {
          slug: slugify(companyName),
          displayName: companyName,
          marketId: market.id,
          publicationStatus: "published",
          confidence: "high",
          reviewedAt: now,
        },
      }),
      prisma.roleFamily.findUnique({ where: { slug: roleFamilySlug } }),
    ]);
    if (!roleFamily) throw new Error(`Missing role family: ${roleFamilySlug}`);

    const url = `https://www.fuzu.com/kenya/jobs/${externalId}`;
    const description = `${title} test opening for ${companyName}. This fixture is intended for JobReady marketplace, interview, application tracking, and CV tailoring QA.`;
    const content = {
      title,
      description,
      responsibilities: [
        "Own day-to-day execution for the role's core workflow.",
        "Collaborate with cross-functional teams and communicate progress clearly.",
        "Track outcomes, risks, and improvements for weekly review.",
      ],
      requirements: [
        "Relevant training or practical experience in the role area.",
        "Strong communication, ownership, and problem-solving skills.",
        "Comfort working with digital tools in a fast-moving team.",
      ],
      preferredQualifications: ["Experience in a Kenyan or East African operating environment."],
      location,
    };

    const posting = await prisma.jobPosting.create({
      data: {
        slug: `${slugify(companyName)}-${slugify(title)}-${externalId.slice(-8)}`,
        companyId: company.id,
        marketId: market.id,
        roleFamilyId: roleFamily.id,
        jobSourceId: source.id,
        status: "published",
        firstSeenAt: now,
        lastVerifiedAt: now,
        closesAt,
        publishedAt: now,
      },
    });
    const version = await prisma.jobPostingVersion.create({
      data: {
        jobPostingId: posting.id,
        version: 1,
        ...content,
        workType: location.toLowerCase().includes("remote") ? "remote" : "onsite",
        employmentType: title.toLowerCase().includes("intern") ? "internship" : "full_time",
        jobSourceId: source.id,
        applicationUrl: url,
        applicationUrlHost: "fuzu.com",
        applicationUrlVerifiedAt: now,
        applicationUrlVerificationStatus: "verified",
        applicationVerificationEvidence: {
          status: "verified",
          checkedAt: now.toISOString(),
          originalUrl: url,
          finalUrl: url,
          host: "fuzu.com",
          redirects: [],
          flags: [],
          evidence: { verifier: "direct-fallback-test-fixture" },
        },
        sourceUrl: url,
        sourceUrlHost: "fuzu.com",
        sourceExternalId: externalId,
        normalizedTitle: title.toLowerCase(),
        normalizedLocation: location.toLowerCase(),
        riskFlags: [],
        sanitizedContentHash: hash(content),
        sourcePublishedAt: now,
        sourceRetrievedAt: now,
        contentHash: hash({ content, sourceExternalId: externalId, closesAt }),
      },
    });
    await prisma.jobPosting.update({
      where: { id: posting.id },
      data: { currentVersionId: version.id },
    });
    imported.push({ slug: posting.slug, title, company: companyName });
  }

  console.log(JSON.stringify({ imported: imported.length, importedJobs: imported }, null, 2));
}

main().finally(() => prisma.$disconnect());
