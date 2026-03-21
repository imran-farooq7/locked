// app/admin/jobs/page.tsx
import JobMonitor from "@/components/jobs/job-monitor";
import JobStats from "@/components/jobs/job-stats";
import { LoadingSkeleton } from "@/components/payments/LoadingSkeleton";
import { Suspense } from "react";

export default function AdminJobsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Background Jobs</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage automated tasks and cron jobs
          </p>
        </div>

        <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800">
          Trigger Manual Run
        </button>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <JobStats />
      </Suspense>

      <JobMonitor />
    </div>
  );
}
