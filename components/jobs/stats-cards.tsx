// components/jobs/stats-cards.tsx
import { memo } from "react";
import { JobStats } from "@/hooks/use-job-monitor";
import { getStatusColor } from "@/lib/job-utils";

interface StatsCardsProps {
  stats: JobStats;
}

export const StatsCards = memo(function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {Object.entries(stats).map(([status, count]) => (
        <div
          key={status}
          className={`border rounded-lg p-6 ${getStatusColor(status)}`}
        >
          <div className="text-3xl font-bold">{count}</div>
          <div className="text-sm font-medium capitalize mt-1">
            {status} Jobs
          </div>
        </div>
      ))}
    </div>
  );
});
