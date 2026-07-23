import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const expectedVisaTypes = [
  "US J1 Exchange",
  "US M1 Vocational Student",
  "US F2/J2 Dependent",
  "US H1B Specialty Worker",
  "US L1 Transfer",
  "US O1 Extraordinary Ability",
  "US K1 Fiance",
  "US CR1/IR1 Spouse",
  "Canada Visitor Visa",
  "Canada Work Permit",
  "Schengen Business",
  "Australia Visitor Visa",
  "UK Standard Visitor",
  "UK Skilled Worker",
  "UK Health and Care Worker",
  "Germany Student Visa",
  "Germany Job Seeker",
  "Germany EU Blue Card",
];

async function main() {
  const sensitiveCounts = {
    users: await prisma.user.count(),
    interviews: await prisma.interviewSession.count(),
    purchases: await prisma.purchase.count(),
    reports: await prisma.report.count(),
    messages: await prisma.message.count(),
  };

  const savedVisaTypes = await prisma.visaType.findMany({
    where: { name: { in: expectedVisaTypes } },
    select: {
      name: true,
      isActive: true,
      destinationCountry: { select: { name: true, isoCode: true } },
      category: { select: { slug: true, label: true } },
      concernOptions: { select: { label: true } },
    },
    orderBy: { name: "asc" },
  });

  const savedNames = new Set(savedVisaTypes.map((visaType) => visaType.name));
  const missingVisaTypes = expectedVisaTypes.filter((name) => !savedNames.has(name));

  console.log("Sensitive table counts:", sensitiveCounts);
  console.log("Expected visa types:", expectedVisaTypes.length);
  console.log("Saved visa types:", savedVisaTypes.length);

  for (const visaType of savedVisaTypes) {
    console.log(
      [
        visaType.name,
        visaType.destinationCountry.isoCode,
        visaType.category.slug,
        visaType.isActive ? "active" : "inactive",
        `${visaType.concernOptions.length} concern options`,
      ].join(" | "),
    );
  }

  if (missingVisaTypes.length > 0) {
    console.error("Missing visa types:", missingVisaTypes);
    process.exitCode = 1;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
