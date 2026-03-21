// app/admin/analytics/page.tsx
import AnalyticsDashboard from "@/components/admin/analytics-dashboard";
import QuickStats from "@/components/admin/analytics/quick-stats";
import { LoadingSkeleton } from "@/components/payments/LoadingSkeleton";
import { Suspense } from "react";

export default async function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-2">
            Platform metrics and performance insights
          </p>
        </div>

        <div className="flex space-x-3">
          <select className="border rounded-lg px-4 py-2">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>This year</option>
          </select>

          <button className="border rounded-lg px-4 py-2 hover:bg-gray-50">
            Export Report
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <Suspense fallback={<LoadingSkeleton />}>
        <QuickStats />
      </Suspense>

      {/* Analytics Dashboard Component */}

      <Suspense fallback={<LoadingSkeleton />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  );
}
