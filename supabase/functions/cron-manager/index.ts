// supabase/functions/cron-manager/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import {
  corsHeaders,
  createEdgeSupabaseClient,
  handleCors,
} from "../_shared/cors.ts";

interface CronJob {
  name: string;
  schedule: string; // cron expression
  jobType: string;
  payload?: any;
  priority: number;
  lastRun?: string;
  nextRun: string;
  enabled: boolean;
}

// Cron schedule definitions
const CRON_JOBS: CronJob[] = [
  {
    name: "process_pending_penalties",
    schedule: "*/5 * * * *", // Every 5 minutes
    jobType: "process_penalty_batch",
    priority: 1,
    nextRun: calculateNextRun("*/5 * * * *"),
    enabled: true,
  },
  {
    name: "check_expired_goals",
    schedule: "0 * * * *", // Every hour
    jobType: "process_expired_goals",
    payload: { batch_size: 100 },
    priority: 2,
    nextRun: calculateNextRun("0 * * * *"),
    enabled: true,
  },
  {
    name: "send_proof_reminders",
    schedule: "0 9,18 * * *", // 9 AM and 6 PM daily
    jobType: "send_proof_reminder_batch",
    priority: 3,
    nextRun: calculateNextRun("0 9,18 * * *"),
    enabled: true,
  },
  {
    name: "sync_stripe_subscriptions",
    schedule: "0 2 * * *", // 2 AM daily
    jobType: "sync_stripe_subscriptions",
    priority: 3,
    nextRun: calculateNextRun("0 2 * * *"),
    enabled: true,
  },
  {
    name: "send_daily_summaries",
    schedule: "0 20 * * *", // 8 PM daily
    jobType: "send_daily_summary",
    priority: 4,
    nextRun: calculateNextRun("0 20 * * *"),
    enabled: true,
  },
  {
    name: "cleanup_old_data",
    schedule: "0 3 * * 0", // 3 AM every Sunday
    jobType: "cleanup_old_data",
    payload: { days_to_keep: 30 },
    priority: 5,
    nextRun: calculateNextRun("0 3 * * 0"),
    enabled: true,
  },
];

function calculateNextRun(cronExpression: string): string {
  // Simplified next run calculation
  const now = new Date();
  const [minute, hour, dayOfMonth, month, dayOfWeek] =
    cronExpression.split(" ");

  const next = new Date(now);

  if (minute !== "*") {
    const nextMinute = parseInt(minute);
    if (next.getMinutes() < nextMinute) {
      next.setMinutes(nextMinute);
    } else {
      next.setHours(next.getHours() + 1);
      next.setMinutes(parseInt(minute));
    }
  }

  if (hour !== "*") {
    const hours = hour.split(",").map((h) => parseInt(h));
    const nextHour = hours.find((h) => h > next.getHours()) || hours[0];
    if (nextHour > next.getHours()) {
      next.setHours(nextHour);
    } else {
      next.setDate(next.getDate() + 1);
      next.setHours(hours[0]);
    }
  }

  return next.toISOString();
}

function shouldRunCron(cronJob: CronJob): boolean {
  const now = new Date();
  const nextRun = new Date(cronJob.nextRun);
  return now >= nextRun;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Verify cron manager secret
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const cronSecret = authHeader.split("Bearer ")[1];
  if (cronSecret !== Deno.env.get("CRON_MANAGER_SECRET")) {
    return new Response(JSON.stringify({ error: "Invalid cron secret" }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  const supabase = createEdgeSupabaseClient(req);
  const results = [];

  try {
    for (const cronJob of CRON_JOBS) {
      if (!cronJob.enabled) continue;

      if (shouldRunCron(cronJob)) {
        // Enqueue the job
        const { data: jobId, error } = await supabase.rpc("enqueue_job", {
          p_job_type: cronJob.jobType,
          p_payload: cronJob.payload || {},
          p_priority: cronJob.priority,
          p_scheduled_for: new Date().toISOString(),
        });

        if (error) {
          results.push({
            cronJob: cronJob.name,
            status: "failed",
            error: error.message,
          });
        } else {
          // Update next run time
          cronJob.nextRun = calculateNextRun(cronJob.schedule);
          results.push({
            cronJob: cronJob.name,
            status: "queued",
            jobId,
            nextRun: cronJob.nextRun,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        results,
        nextCheck: new Date(Date.now() + 60000).toISOString(), // Check again in 1 minute
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Cron manager error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
