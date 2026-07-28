import { PrismaClient } from "@prisma/client";
import { seedKenyanLaunchCatalog } from "../prisma/jobready-launch-catalog";

const prisma = new PrismaClient();

function databaseHost() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return "DATABASE_URL not set";

  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return "unparseable DATABASE_URL";
  }
}

async function main() {
  const summary = await seedKenyanLaunchCatalog(prisma);

  console.log(
    JSON.stringify(
      {
        databaseHost: databaseHost(),
        ...summary,
      },
      null,
      2,
    ),
  );
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
