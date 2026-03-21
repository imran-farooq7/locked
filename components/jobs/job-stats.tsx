import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Activity, CheckCircle, AlertCircle, Clock } from "lucide-react";

type JobStatus = "pending" | "processing" | "completed" | "failed";

const JOB_STATUS_CARDS: Record<
  JobStatus,
  { label: string; color: string; Icon: typeof Clock }
> = {
  pending: { label: "Pending", color: "text-yellow-600", Icon: Clock },
  processing: { label: "Processing", color: "text-blue-600", Icon: Activity },
  completed: { label: "Completed", color: "text-green-600", Icon: CheckCircle },
  failed: { label: "Failed", color: "text-red-600", Icon: AlertCircle },
};

async function getJobStats() {
  const supabase = await createSupabaseServerClient();
  const statusKeys: JobStatus[] = [
    "pending",
    "processing",
    "completed",
    "failed",
  ];

  const results = await Promise.all(
    statusKeys.map(async (status) => {
      const { count, error } = await supabase
        .from("job_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", status);

      if (error) {
        throw error;
      }

      return [status, count ?? 0] as const;
    }),
  );

  return Object.fromEntries(results) as Record<JobStatus, number>;
}

export default async function JobStats() {
  const jobStats = await getJobStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Object.entries(JOB_STATUS_CARDS).map(([status, config]) => {
        const key = status as JobStatus;
        const count = jobStats[key] ?? 0;
        const Icon = config.Icon;

        return (
          <div key={status} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${config.color}`}>
                  {count}
                </div>
                <div className="text-gray-600">{config.label}</div>
              </div>
              <Icon className={`w-8 h-8 ${config.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
