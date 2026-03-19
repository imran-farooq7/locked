import { createSupabaseServerClient } from "@/lib/supabase/server";
import GoalsList from "@/components/goals/goals-list";
import { redirect } from "next/navigation";
import StatsOverview from "@/components/dashboard/stats-overview";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import UpcomingDeadlines from "@/components/dashboard/upcoming-deadlines";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/payments/LoadingSkeleton";
import { cache } from "react";

export default async function DashboardContent() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <Suspense fallback={<LoadingSkeleton items={3} />}>
        <DashboardHeader />

        {/* Stats Overview */}
        <StatsOverview />

        {/* Upcoming Deadlines */}
        <UpcomingDeadlines />
      </Suspense>

      {/* Goals List */}
      <div className="rounded-lg border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Goals</h2>
        </div>
        <GoalsList />
      </div>
    </div>
  );
}
