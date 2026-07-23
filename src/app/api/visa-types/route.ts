import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countryId = searchParams.get("countryId");

  if (!countryId) {
    return NextResponse.json(
      { error: "countryId is required." },
      { status: 400 },
    );
  }

  const visaTypes = await prisma.visaType.findMany({
    where: {
      destinationCountryId: countryId,
      isActive: true,
      destinationCountry: { isActive: true, isDestination: true },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      category: {
        select: {
          id: true,
          slug: true,
          label: true,
        },
      },
      destinationCountry: {
        select: {
          id: true,
          name: true,
          isoCode: true,
          flagEmoji: true,
        },
      },
    },
  });

  return NextResponse.json({ visaTypes });
}
