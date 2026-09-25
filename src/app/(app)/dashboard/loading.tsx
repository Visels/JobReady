import { DashboardBodySkeleton } from "@/components/dashboard/DashboardSkeleton";

export default function DashboardLoading() {
  return (
    <main className="min-h-[calc(100dvh-64px)] px-4 py-4 text-foreground md:px-6 lg:px-8 lg:py-5">
      <div className="mx-auto max-w-[1440px]">
        <DashboardBodySkeleton />
      </div>
    </main>
  );
}
