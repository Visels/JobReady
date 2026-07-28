import { DashboardBodySkeleton } from "@/components/dashboard/DashboardSkeleton";

export default function DashboardLoading() {
  return (
    <main className="min-h-[calc(100dvh-86px)] px-4 py-5 text-foreground md:px-6 lg:px-7">
      <div className="mx-auto max-w-[1220px]">
        <DashboardBodySkeleton />
      </div>
    </main>
  );
}
