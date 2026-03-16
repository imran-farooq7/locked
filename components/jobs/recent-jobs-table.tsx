// components/jobs/recent-jobs-table.tsx
import { memo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { RecentJob } from "@/hooks/use-job-monitor";
import { getStatusColor, formatJobType } from "@/lib/job-utils";
import { JobStatusIcon } from "./job-status-icon";

interface RecentJobsTableProps {
  jobs: RecentJob[];
}

export const RecentJobsTable = memo(function RecentJobsTable({
  jobs,
}: RecentJobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="font-semibold">Recent Jobs</h3>
        </div>
        <div className="px-6 py-12 text-center text-gray-500">
          No recent jobs found
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b">
        <h3 className="font-semibold">Recent Jobs</h3>
      </div>

      <div className="divide-y">
        {jobs.map((job) => (
          <div key={job.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <JobStatusIcon status={job.status || "unknown"} />
                  <div>
                    <div className="font-medium">
                      {formatJobType(job.job_type)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(job.created_at!), "PPpp")}
                      {job.started_at && (
                        <span className="ml-2">
                          • Started{" "}
                          {formatDistanceToNow(new Date(job.started_at))} ago
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {job.error_message && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                    {job.error_message}
                  </div>
                )}
              </div>

              <div className="ml-4">
                <span
                  className={`px-3 py-1 text-xs rounded-full ${getStatusColor(job.status || "unknown")}`}
                >
                  {(job.status || "unknown").toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
