import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const documents = await prisma.requiredDocument.findMany({
    where: {
      visaTypeId: id,
      visaType: { isActive: true },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      isMandatory: true,
      displayOrder: true,
    },
  });

  return NextResponse.json({ documents });
}
