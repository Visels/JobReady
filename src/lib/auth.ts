import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  createResendContact,
  hasResendContactConfig,
  hasTransactionalEmailConfig,
  sendWelcomeEmail,
} from "@/lib/email";
import { FREE_SESSION_ALLOWANCE } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function metadataString(user: SupabaseUser, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function profileFromSupabaseUser(user: SupabaseUser) {
  const name =
    metadataString(user, "full_name") ??
    metadataString(user, "display_name") ??
    metadataString(user, "name");
  const image =
    metadataString(user, "avatar_url") ?? metadataString(user, "picture");

  return {
    id: user.id,
    name,
    email: user.email?.toLowerCase() ?? null,
    emailVerified: user.email_confirmed_at
      ? new Date(user.email_confirmed_at)
      : null,
    image,
  };
}

async function sendWelcomeEmailIfNeeded(user: {
  id: string;
  name: string | null;
  email: string | null;
  welcomeEmailSentAt: Date | null;
}) {
  if (!user.email || user.welcomeEmailSentAt || !hasTransactionalEmailConfig()) {
    return;
  }

  const claimedAt = new Date();
  const claim = await prisma.user.updateMany({
    where: {
      id: user.id,
      welcomeEmailSentAt: null,
    },
    data: {
      welcomeEmailSentAt: claimedAt,
    },
  });

  if (claim.count === 0) return;

  try {
    const result = await sendWelcomeEmail({
      userId: user.id,
      to: user.email,
      name: user.name,
    });

    if (result.status === "skipped") {
      await prisma.user.updateMany({
        where: {
          id: user.id,
          welcomeEmailSentAt: claimedAt,
        },
        data: {
          welcomeEmailSentAt: null,
        },
      });
    }
  } catch (error) {
    console.error("Could not send welcome email.", error);
    await prisma.user.updateMany({
      where: {
        id: user.id,
        welcomeEmailSentAt: claimedAt,
      },
      data: {
        welcomeEmailSentAt: null,
      },
    });
  }
}

async function createResendContactIfNeeded(user: {
  id: string;
  name: string | null;
  email: string | null;
  resendContactSyncedAt: Date | null;
}) {
  if (!user.email || user.resendContactSyncedAt || !hasResendContactConfig()) {
    return;
  }

  const claimedAt = new Date();
  const claim = await prisma.user.updateMany({
    where: {
      id: user.id,
      resendContactSyncedAt: null,
    },
    data: {
      resendContactSyncedAt: claimedAt,
    },
  });

  if (claim.count === 0) return;

  try {
    const result = await createResendContact({
      email: user.email,
      name: user.name,
    });

    if (result.status === "skipped") {
      await prisma.user.updateMany({
        where: {
          id: user.id,
          resendContactSyncedAt: claimedAt,
        },
        data: {
          resendContactSyncedAt: null,
        },
      });
    }
  } catch (error) {
    console.error("Could not create Resend contact.", error);
    await prisma.user.updateMany({
      where: {
        id: user.id,
        resendContactSyncedAt: claimedAt,
      },
      data: {
        resendContactSyncedAt: null,
      },
    });
  }
}

export async function syncAppUser(authUser: SupabaseUser) {
  const profile = profileFromSupabaseUser(authUser);

  const user = await prisma.user.upsert({
    where: { id: profile.id },
    create: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      emailVerified: profile.emailVerified,
      image: profile.image,
      credits: FREE_SESSION_ALLOWANCE,
    },
    update: {
      name: profile.name ?? undefined,
      email: profile.email,
      emailVerified: profile.emailVerified,
      image: profile.image ?? undefined,
    },
  });

  await createResendContactIfNeeded(user);
  await sendWelcomeEmailIfNeeded(user);

  return user;
}

export async function getCurrentUser() {
  let supabase;

  try {
    supabase = await createServerSupabaseClient();
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Supabase auth requires")
    ) {
      return null;
    }

    throw error;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return syncAppUser(user);
}
