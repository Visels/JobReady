import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const concernOptions = await prisma.concernOption.findMany({
    where: {
      visaTypeId: id,
      visaType: { isActive: true },
    },
    orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    select: {
      id: true,
      label: true,
      displayOrder: true,
    },
  });

  return NextResponse.json({ concernOptions });
}
