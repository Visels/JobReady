import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { paidAccessExpiresAt, WEEKLY_ACCESS_DURATION_DAYS } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session-guards";

export const runtime = "nodejs";

const LAUNCH_PROMO_PLAN = "launch100";
const LAUNCH_PROMO_LIMIT = 100;
const MAX_TRANSACTION_RETRIES = 5;

type LaunchPromoResult = {
  accessExpiresAt: Date | null;
  status: "already_claimed" | "claimed" | "sold_out";
};

function isPrismaConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function redeemLaunchPromo(userId: string): Promise<LaunchPromoResult> {
  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.purchase.findFirst({
        where: { userId, plan: LAUNCH_PROMO_PLAN },
        select: { accessExpiresAt: true },
      });

      if (existing) {
        return {
          status: "already_claimed" as const,
          accessExpiresAt: existing.accessExpiresAt,
        };
      }

      const claimedCount = await tx.purchase.count({
        where: { plan: LAUNCH_PROMO_PLAN },
      });

      if (claimedCount >= LAUNCH_PROMO_LIMIT) {
        return {
          status: "sold_out" as const,
          accessExpiresAt: null,
        };
      }

      const now = new Date();
      const accessExpiresAt = paidAccessExpiresAt(
        now,
        WEEKLY_ACCESS_DURATION_DAYS,
      );

      await tx.purchase.create({
        data: {
          userId,
          provider: "flutterwave",
          flutterwaveTxRef: `${LAUNCH_PROMO_PLAN}:${userId}`,
          plan: LAUNCH_PROMO_PLAN,
          planDays: WEEKLY_ACCESS_DURATION_DAYS,
          accessExpiresAt,
          amount: 0,
          currency: "usd",
          creditsGranted: 0,
        },
      });

      return {
        status: "claimed" as const,
        accessExpiresAt,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export async function POST() {
  const { user, response } = await requireUser();
  if (!user) return response;

  for (let attempt = 1; attempt <= MAX_TRANSACTION_RETRIES; attempt += 1) {
    try {
      return NextResponse.json(await redeemLaunchPromo(user.id));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json({
          status: "already_claimed",
          accessExpiresAt: null,
        });
      }

      if (isPrismaConflict(error) && attempt < MAX_TRANSACTION_RETRIES) {
        await wait(50 * attempt);
        continue;
      }

      throw error;
    }
  }

  return NextResponse.json(
    { status: "error", accessExpiresAt: null },
    { status: 409 },
  );
}
