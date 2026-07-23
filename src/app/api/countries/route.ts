import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get("destination") === "true";
  const origin = searchParams.get("origin") === "true";

  const countries = await prisma.country.findMany({
    where: {
      isActive: true,
      ...(destination ? { isDestination: true } : {}),
      ...(origin ? { isOrigin: true } : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      isoCode: true,
      flagEmoji: true,
    },
  });

  return NextResponse.json({ countries });
}
