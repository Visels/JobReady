import { redirect } from "next/navigation";
import { DM_Sans, Fraunces } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
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

  const plan = await getDashboardSidebarPlan(user.id);

  return (
    <AppShell
      plan={plan}
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
