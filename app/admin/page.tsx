// app/admin/page.tsx
import { fetchAdminDashboardData } from "@/lib/admin-dashboard";
import StatsGrid from "@/components/admin/stats-grid";
import RecentPayments from "@/components/admin/recent-payments";
import RecentUsers from "@/components/admin/recent-users";
import QuickActions from "@/components/admin/quick-actions";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/payments/LoadingSkeleton";

export default async function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of your platform's performance and metrics
        </p>
      </div>

      {/* Stats Grid */}
      <Suspense fallback={<LoadingSkeleton items={4} />}>
        <StatsGrid />
      </Suspense>

      {/* Recent Activity */}
      <Suspense fallback={<LoadingSkeleton items={2} />}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentPayments />
          <RecentUsers />
        </div>
      </Suspense>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
