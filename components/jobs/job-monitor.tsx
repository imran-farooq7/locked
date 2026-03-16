// components/jobs/job-monitor.tsx
"use client";

import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { useJobMonitor } from "@/hooks/use-job-monitor";
import { StatsCards } from "./stats-cards";
import { RecentJobsTable } from "./recent-jobs-table";
import { JobActions } from "./job-actions";
import { JobMonitorLoading } from "./job-monitor-loading";

export default function JobMonitor() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { stats, recentJobs, loading, error, refetch } =
    useJobMonitor(autoRefresh);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleActionComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  if (loading) {
    return <JobMonitorLoading />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            Failed to load job data: {error}
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Background Jobs Monitor</h2>
          <p className="text-gray-600">
            Real-time monitoring of automated tasks
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh (30s)</span>
          </label>

          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Recent Jobs Table */}
      <RecentJobsTable jobs={recentJobs} />

      {/* Job Actions */}
      <JobActions onActionComplete={handleActionComplete} />
    </div>
  );
}
