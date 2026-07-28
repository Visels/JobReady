import { redirect } from "next/navigation";
import { DM_Sans, Fraunces } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { adminActorFromUser } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSidebarPlan } from "@/lib/dashboard";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [plan, adminActor] = await Promise.all([
    getDashboardSidebarPlan(user.id),
    Promise.resolve(adminActorFromUser(user)),
  ]);

  return (
    <AppShell
      plan={plan}
      canManageContent={Boolean(adminActor)}
      user={{
        name: user.name ?? null,
        email: user.email ?? null,
        image: user.image ?? null,
      }}
      className={`${dmSans.variable} ${fraunces.variable} min-h-viewport bg-surface font-sans text-primary`}
    >
      {children}
    </AppShell>
  );
}
