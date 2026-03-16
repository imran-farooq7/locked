// hooks/use-job-monitor.ts
import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

export interface JobStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retry: number;
}

export interface RecentJob {
  id: string;
  job_type: string;
  status: string | null;
  created_at: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
}

export function useJobMonitor(autoRefresh: boolean = true) {
  const [stats, setStats] = useState<JobStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    retry: 0,
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseClient();

  const loadJobData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load job statistics with proper aggregation
      const { data: jobStats, error: statsError } = await supabase
        .from("job_queue")
        .select("status");

      if (statsError) throw statsError;

      // Calculate stats using reduce for better performance
      const newStats = (jobStats || []).reduce(
        (acc, job) => {
          const status = job.status as keyof JobStats;
          if (status in acc) {
            acc[status]++;
          }
          return acc;
        },
        {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          retry: 0,
        } as JobStats,
      );

      setStats(newStats);

      // Load recent jobs
      const { data: jobs, error: jobsError } = await supabase
        .from("job_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (jobsError) throw jobsError;

      setRecentJobs(jobs || []);
    } catch (err) {
      console.error("Failed to load job data:", err);
      setError(err instanceof Error ? err.message : "Failed to load job data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadJobData();

    if (autoRefresh) {
      const interval = setInterval(loadJobData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [loadJobData, autoRefresh]);

  return {
    stats,
    recentJobs,
    loading,
    error,
    refetch: loadJobData,
  };
}
