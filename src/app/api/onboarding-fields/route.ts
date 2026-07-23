import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");

  if (!categoryId) {
    return NextResponse.json(
      { error: "categoryId is required." },
      { status: 400 },
    );
  }

  const fields = await prisma.onboardingField.findMany({
    where: { visaCategoryId: categoryId },
    orderBy: [{ displayOrder: "asc" }, { label: "asc" }],
    select: {
      id: true,
      key: true,
      label: true,
      placeholder: true,
      inputType: true,
      required: true,
      displayOrder: true,
    },
  });

  return NextResponse.json({ fields });
}
