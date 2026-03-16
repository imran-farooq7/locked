// components/jobs/job-monitor-loading.tsx
import { memo } from "react";

export const JobMonitorLoading = memo(function JobMonitorLoading() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse h-32 bg-gray-200 rounded-lg"></div>
      <div className="animate-pulse h-64 bg-gray-200 rounded-lg"></div>
    </div>
  );
});
