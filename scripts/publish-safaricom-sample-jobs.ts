import { prisma } from "../src/lib/prisma";
import {
  StaticApplicationDestinationVerifier,
  VerifiedJobPublicationService,
} from "../src/lib/jobs/verified-job-publication";

const closesAt = new Date("2026-08-04T12:00:00.000Z");
const retrievedAt = new Date("2026-07-28T14:00:00.000Z");

const jobs = [
  {
    externalId: "1405",
    title: "Lead, Nextgen FinTech",
    url: "https://egjd.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX/job/1405?utm_source=linkedin&utm_medium=jobboard",
    description:
      "Lead the strategy, commercial performance, and product portfolio for M-PESA next-generation financial solutions, including digital savings, investments, wealth management, insurance, and emerging fintech propositions.",
    responsibilities: [
      "Define the end-to-end strategy and long-term vision for next-generation fintech solutions.",
      "Own portfolio performance across wealth, insurance, and emerging fintech propositions.",
      "Lead cross-functional delivery with Technology, Risk, Data, Marketing, and ecosystem partners.",
    ],
    requirements: [
      "Bachelor's degree in Finance, Economics, Business Administration, Technology, or a related discipline.",
      "12+ years of progressive financial services, fintech, digital banking, or investment-products experience.",
      "Senior leadership experience leading multidisciplinary teams and large portfolios.",
    ],
    roleSlug: "product-management",
  },
  {
    externalId: "1408",
    title: "ICT Sales Lead",
    url: "https://egjd.fa.us6.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX/job/1408?utm_source=linkedin&utm_medium=jobboard",
    description:
      "Drive commercial execution, revenue growth, and market leadership across enterprise ICT solutions including connectivity, cloud, cybersecurity, managed services, IoT, digital platforms, and enterprise applications.",
    responsibilities: [
      "Own ICT revenue, bookings, margin, and long-term value creation across enterprise, SME, and public-sector segments.",
      "Lead solution-led selling across cloud, connectivity, cybersecurity, IoT, and managed services.",
      "Build a high-performing ICT sales organisation through coaching and commercial discipline.",
    ],
    requirements: [
      "Demonstrated leadership of complex enterprise ICT sales and commercial execution.",
      "Experience with cloud, cybersecurity, connectivity, managed services, and solution-led selling.",
      "Strong commercial acumen, account management, and cross-functional leadership.",
    ],
    roleSlug: "product-management",
  },
] as const;

async function main() {
  const [company, market, source, roleFamily] = await Promise.all([
    prisma.company.findUnique({ where: { slug: "safaricom" } }),
    prisma.market.findUnique({ where: { isoCode: "KE" } }),
    prisma.jobSource.findUnique({ where: { id: "task24-source-safaricom-careers" } }),
    prisma.roleFamily.findUnique({ where: { slug: "product-management" } }),
  ]);

  if (!company || !market || !source || !roleFamily) {
    throw new Error("Required Safaricom launch taxonomy is missing. Seed the Kenyan launch catalog first.");
  }

  const service = new VerifiedJobPublicationService({
    prisma,
    now: () => new Date("2026-07-29T12:00:00.000Z"),
    destinationVerifier: new StaticApplicationDestinationVerifier({
      status: "verified",
      finalUrl: "https://egjd.fa.us6.oraclecloud.com/",
      host: "egjd.fa.us6.oraclecloud.com",
      redirects: [],
      flags: [],
      evidence: { verifier: "staff-reviewed-official-oracle-careers" },
    }),
  });

  for (const job of jobs) {
    const existing = await prisma.jobPostingVersion.findFirst({
      where: { sourceExternalId: job.externalId, sourceUrlHost: "egjd.fa.us6.oraclecloud.com" },
      include: { posting: true },
    });
    if (existing?.posting.status === "published") continue;

    const draft = await service.createDraftJob({
      actor: { isAuthorizedStaff: true },
      companyId: company.id,
      marketId: market.id,
      roleFamilyId: roleFamily.id,
      title: job.title,
      description: job.description,
      responsibilities: [...job.responsibilities],
      requirements: [...job.requirements],
      location: "Nairobi, Kenya",
      workType: "onsite",
      employmentType: "full_time",
      closesAt,
      sourcePublishedAt: retrievedAt,
      sourceRetrievedAt: retrievedAt,
      sourceExternalId: job.externalId,
      applicationUrl: job.url,
      sourceUrl: job.url,
      jobSource: { id: source.id },
      contentSource: { title: `Safaricom careers role ${job.externalId}`, publisher: "Safaricom", url: job.url, isOfficial: true },
    });
    const review = await service.submitForReview({ actor: { isAuthorizedStaff: true }, jobPostingId: draft.jobPostingId, notes: "Staff-reviewed official Safaricom Oracle careers listing." });
    await service.recordPublicationReview({
      actor: { isAuthorizedStaff: true },
      reviewId: review.reviewId,
      decisions: { sourceDecision: "approved", duplicateDecision: "approved", applicationDecision: "approved", freshnessDecision: "approved", publicationDecision: "approved", expiryDecision: "approved", nextReviewAt: new Date("2026-08-01T12:00:00.000Z"), notes: "Official Safaricom Oracle career URL, source text, closing date, and destination reviewed." },
    });
    await service.publishJob({ actor: { isAuthorizedStaff: true }, jobPostingId: draft.jobPostingId });
  }

  const published = await prisma.jobPosting.findMany({ where: { status: "published", companyId: company.id }, include: { currentVersion: true }, orderBy: { publishedAt: "desc" } });
  console.log(published.map((job) => ({ slug: job.slug, title: job.currentVersion?.title, closesAt: job.closesAt })));
}

main().finally(() => prisma.$disconnect());
