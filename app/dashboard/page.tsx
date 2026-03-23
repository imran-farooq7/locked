import DashboardContent from "@/components/dashboard/dashboard-content";
import GoalDetailsLink from "@/components/dashboard/goal-details-link";
import { LoadingSkeleton } from "@/components/payments/LoadingSkeleton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="container mx-auto p-6">
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold mb-3">Dashboard Pages</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Dashboard Home
            </Link>
            <Link
              href="/dashboard/settings/payments"
              className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Payment Settings
            </Link>
            <Link
              href="/dashboard/settings/proof"
              className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Proof Settings
            </Link>
            <Suspense fallback={<LoadingSkeleton />}>
              <GoalDetailsLink />
            </Suspense>
          </div>
        </div>
      </div>

      <DashboardContent />
    </div>
  );
}
