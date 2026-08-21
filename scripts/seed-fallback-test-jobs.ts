import { prisma } from "../src/lib/prisma";
import {
  StaticApplicationDestinationVerifier,
  VerifiedJobPublicationService,
} from "../src/lib/jobs/verified-job-publication";

const retrievedAt = new Date("2026-08-21T09:00:00.000Z");
const closesAt = new Date("2026-10-31T23:59:59.000Z");

const jobs = [
  ["Junior Data Analyst", "Nairobi Analytics Lab", "software-engineering", "Nairobi, Kenya"],
  ["Frontend Developer", "Ushahidi Digital Studio", "software-engineering", "Nairobi, Kenya"],
  ["Customer Success Associate", "MaraCare Support", "customer-service", "Remote, Kenya"],
  ["Graduate Product Associate", "Twiga Growth Labs", "product-management", "Nairobi, Kenya"],
  ["Business Development Representative", "Lakeview Commerce", "relationship-management", "Kisumu, Kenya"],
  ["Operations Coordinator", "Savannah Logistics", "product-management", "Mombasa, Kenya"],
  ["IT Support Technician", "Nakuru Systems Hub", "software-engineering", "Nakuru, Kenya"],
  ["Sales Account Executive", "Amani Payments", "relationship-management", "Nairobi, Kenya"],
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

async function main() {
  const market = await prisma.market.findUnique({ where: { isoCode: "KE" } });
  if (!market) throw new Error("Missing KE market. Seed reference data first.");

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

  const serviceForJob = (jobUrl: string) =>
    new VerifiedJobPublicationService({
      prisma,
      now: () => retrievedAt,
      destinationVerifier: new StaticApplicationDestinationVerifier({
        status: "verified",
        finalUrl: jobUrl,
        host: "fuzu.com",
        redirects: [],
        flags: [],
        evidence: { verifier: "static-fallback-test-fixture" },
      }),
    });

  const imported: Array<{ slug: string; title: string; company: string }> = [];

  for (const [title, companyName, roleFamilySlug, location] of jobs) {
    const externalId = `jobready-test-${slugify(companyName)}-${slugify(title)}`;
    const url = `https://www.fuzu.com/kenya/jobs/${externalId}`;
    const existing = await prisma.jobPostingVersion.findFirst({
      where: { sourceExternalId: externalId },
      include: { posting: true },
    });
    if (existing?.posting.status === "published") continue;

    const [company, roleFamily] = await Promise.all([
      prisma.company.upsert({
        where: { slug: slugify(companyName) },
        update: {
          displayName: companyName,
          marketId: market.id,
          publicationStatus: "published",
          confidence: "high",
          reviewedAt: retrievedAt,
        },
        create: {
          slug: slugify(companyName),
          displayName: companyName,
          marketId: market.id,
          publicationStatus: "published",
          confidence: "high",
          reviewedAt: retrievedAt,
        },
      }),
      prisma.roleFamily.findUnique({ where: { slug: roleFamilySlug } }),
    ]);
    if (!roleFamily) throw new Error(`Missing role family: ${roleFamilySlug}`);

    const service = serviceForJob(url);
    const draft = await service.createDraftJob({
      actor: { isAuthorizedStaff: true },
      companyId: company.id,
      marketId: market.id,
      roleFamilyId: roleFamily.id,
      title,
      description: `${title} test opening for ${companyName}. This fixture is intended for JobReady marketplace, interview, application tracking, and CV tailoring QA.`,
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
      preferredQualifications: [
        "Experience in a Kenyan or East African operating environment.",
      ],
      location,
      workType: location.toLowerCase().includes("remote") ? "remote" : "onsite",
      employmentType: title.toLowerCase().includes("intern") ? "internship" : "full_time",
      closesAt,
      sourcePublishedAt: retrievedAt,
      sourceRetrievedAt: retrievedAt,
      sourceExternalId: externalId,
      applicationUrl: url,
      sourceUrl: url,
      jobSource: { id: source.id },
      contentSource: {
        title: `${companyName} ${title} fallback test fixture`,
        publisher: "JobReady",
        url,
        isOfficial: true,
      },
    });
    const review = await service.submitForReview({
      actor: { isAuthorizedStaff: true },
      jobPostingId: draft.jobPostingId,
      notes: "Fallback test fixture approved for local QA data coverage.",
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
        expiryDecision: "approved",
        nextReviewAt: new Date("2026-09-04T09:00:00.000Z"),
        notes: "Internal fixture reviewed for non-production test coverage.",
      },
    });
    await service.publishJob({
      actor: { isAuthorizedStaff: true },
      jobPostingId: draft.jobPostingId,
    });
    imported.push({ slug: draft.slug, title, company: companyName });
  }

  console.log(JSON.stringify({ imported: imported.length, importedJobs: imported }, null, 2));
}

main().finally(() => prisma.$disconnect());
