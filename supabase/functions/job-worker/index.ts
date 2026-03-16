// supabase/functions/job-worker/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  createEdgeSupabaseClient,
  handleCors,
} from "../_shared/cors.ts";

const JOB_TIMEOUT = 300000; // 5 minutes
const MAX_JOBS_PER_RUN = 10;

// Job handlers registry
const jobHandlers: Record<
  string,
  (payload: any, supabase: any) => Promise<any>
> = {
  send_proof_reminder: handleProofReminder,
  process_expired_goals: handleExpiredGoals,
  sync_stripe_subscriptions: handleStripeSync,
  send_daily_summary: handleDailySummary,
  cleanup_old_data: handleDataCleanup,
  retry_failed_payments: handlePaymentRetry,
};

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Verify worker secret
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const workerSecret = authHeader.split("Bearer ")[1];
  if (workerSecret !== Deno.env.get("WORKER_SECRET")) {
    return new Response(JSON.stringify({ error: "Invalid worker secret" }), {
      status: 403,
      headers: corsHeaders,
    });
  }

  const supabase = createEdgeSupabaseClient(req);
  const results = [];

  try {
    // Fetch and process multiple jobs
    for (let i = 0; i < MAX_JOBS_PER_RUN; i++) {
      const { data: jobs, error } = await supabase.rpc("fetch_next_job");

      if (error || !jobs || jobs.length === 0) break;

      const job = jobs[0];
      const handler = jobHandlers[job.job_type];

      if (!handler) {
        await supabase.rpc("fail_job", {
          p_job_id: job.id,
          p_error_message: `Unknown job type: ${job.job_type}`,
        });
        results.push({
          jobId: job.id,
          status: "failed",
          error: "Unknown job type",
        });
        continue;
      }

      // Process job with timeout
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Job timeout")), JOB_TIMEOUT),
        );

        const result = await Promise.race([
          handler(job.payload, supabase),
          timeoutPromise,
        ]);

        await supabase.rpc("complete_job", {
          p_job_id: job.id,
          p_result: result,
        });

        results.push({ jobId: job.id, status: "completed" });
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);

        await supabase.rpc("fail_job", {
          p_job_id: job.id,
          p_error_message: error.message,
          p_error_stack: error.stack,
        });

        results.push({
          jobId: job.id,
          status: "failed",
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Worker error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

// Job Handlers Implementation
async function handleProofReminder(payload: any, supabase: any) {
  const { goal_id, user_id } = payload;

  // Get goal details
  const { data: goal } = await supabase
    .from("goals")
    .select("title, target_date")
    .eq("id", goal_id)
    .single();

  // Get user email
  const { data: user } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user_id)
    .single();

  // Send reminder email (mock implementation)

  return { sent: true, email: user.email, goal: goal.title };
}

async function handleExpiredGoals(payload: any, supabase: any) {
  const { batch_size = 50 } = payload;

  // Find expired goals
  const { data: expiredGoals, error } = await supabase
    .from("goals")
    .select("id, user_id, title, penalty_amount")
    .eq("status", "active")
    .lt("target_date", new Date().toISOString())
    .limit(batch_size);

  if (error) throw error;

  // Process each expired goal
  for (const goal of expiredGoals) {
    // Enqueue penalty charge
    await supabase.rpc("enqueue_job", {
      p_job_type: "process_penalty",
      p_payload: {
        goal_id: goal.id,
        user_id: goal.user_id,
        amount: goal.penalty_amount,
        reason: "Goal deadline expired",
      },
      p_priority: 2,
    });

    // Mark goal as failed
    await supabase
      .from("goals")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", goal.id);
  }

  return { processed: expiredGoals.length };
}

async function handleStripeSync(payload: any, supabase: any) {
  // Sync subscription statuses from Stripe
  const stripe = await import("https://esm.sh/stripe@15.0.0");
  const stripeClient = stripe.default(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2025-01-27.acacia",
    httpClient: stripe.fetchAdapter(),
  });

  // Get active subscriptions from database
  const { data: goals } = await supabase
    .from("goals")
    .select("id, stripe_subscription_id, status")
    .not("stripe_subscription_id", "is", null)
    .eq("status", "active")
    .limit(100);

  for (const goal of goals) {
    try {
      const subscription = await stripeClient.subscriptions.retrieve(
        goal.stripe_subscription_id,
      );

      if (
        subscription.status === "canceled" ||
        subscription.status === "unpaid"
      ) {
        // Update goal status
        await supabase
          .from("goals")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", goal.id);
      }
    } catch (error) {
      console.error(
        `Failed to sync subscription ${goal.stripe_subscription_id}:`,
        error,
      );
    }
  }

  return { synced: goals.length };
}
function handleDailySummary(payload: any, supabase: any): Promise<any> {
  return (async () => {
    const { user_id, date, create_notification = true } = payload ?? {};

    if (!user_id) {
      throw new Error("Missing user_id for daily summary");
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const endOfDay = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const [activeRes, failedRes, completedRes] = await Promise.all([
      supabase
        .from("goals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id)
        .eq("status", "active"),
      supabase
        .from("goals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id)
        .eq("status", "failed"),
      supabase
        .from("goals")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user_id)
        .eq("status", "completed"),
    ]);

    if (activeRes.error || failedRes.error || completedRes.error) {
      throw activeRes.error || failedRes.error || completedRes.error;
    }

    const { data: submissions, error: submissionsError } = await supabase
      .from("goal_submissions")
      .select("verification_status")
      .eq("user_id", user_id)
      .gte("created_at", startOfDay.toISOString())
      .lte("created_at", endOfDay.toISOString());

    if (submissionsError) throw submissionsError;

    const totalSubmissions = submissions?.length ?? 0;
    const approvedSubmissions =
      submissions?.filter((s: any) => s.verification_status === "approved")
        .length ?? 0;

    const summary = {
      date: startOfDay.toISOString().slice(0, 10),
      goals: {
        active: activeRes.count ?? 0,
        failed: failedRes.count ?? 0,
        completed: completedRes.count ?? 0,
      },
      submissions: {
        total: totalSubmissions,
        approved: approvedSubmissions,
      },
    };

    if (create_notification) {
      await supabase.from("notifications").insert({
        user_id,
        type: "daily_summary",
        title: "Daily Summary",
        message: `Today: ${summary.submissions.total} submissions, ${summary.goals.active} active goals.`,
        metadata: summary,
      });
    }

    return summary;
  })();
}

function handleDataCleanup(payload: any, supabase: any): Promise<any> {
  return (async () => {
    const {
      job_retention_days = 30,
      notification_retention_days = 90,
      include_notifications = false,
      dry_run = false,
    } = payload ?? {};

    const jobCutoff = new Date(
      Date.now() - job_retention_days * 24 * 60 * 60 * 1000,
    ).toISOString();

    let jobsDeleted = 0;
    if (dry_run) {
      const { count } = await supabase
        .from("job_queue")
        .select("id", { count: "exact", head: true })
        .in("status", ["completed", "failed"])
        .lt("completed_at", jobCutoff);
      jobsDeleted = count ?? 0;
    } else {
      const { data } = await supabase
        .from("job_queue")
        .delete()
        .in("status", ["completed", "failed"])
        .lt("completed_at", jobCutoff)
        .select("id");
      jobsDeleted = data?.length ?? 0;
    }

    let notificationsDeleted = 0;
    if (include_notifications) {
      const notificationCutoff = new Date(
        Date.now() - notification_retention_days * 24 * 60 * 60 * 1000,
      ).toISOString();

      if (dry_run) {
        const { count } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .lt("created_at", notificationCutoff);
        notificationsDeleted = count ?? 0;
      } else {
        const { data } = await supabase
          .from("notifications")
          .delete()
          .lt("created_at", notificationCutoff)
          .select("id");
        notificationsDeleted = data?.length ?? 0;
      }
    }

    return {
      dry_run,
      job_cutoff: jobCutoff,
      jobs_deleted: jobsDeleted,
      notifications_deleted: notificationsDeleted,
    };
  })();
}

function handlePaymentRetry(payload: any, supabase: any): Promise<any> {
  return (async () => {
    const {
      penalty_charge_id,
      batch_size = 20,
      max_attempts = 3,
    } = payload ?? {};

    const penaltyQuery = supabase
      .from("penalty_charges")
      .select(
        `
        *,
        profiles(stripe_customer_id),
        goals(title)
      `,
      )
      .lte("due_date", new Date().toISOString())
      .lt("charge_attempts", max_attempts)
      .in("status", ["failed", "pending"])
      .order("due_date", { ascending: true })
      .limit(batch_size);

    if (penalty_charge_id) {
      penaltyQuery.eq("id", penalty_charge_id);
    }

    const { data: penalties, error } = await penaltyQuery;
    if (error) throw error;

    const results = await Promise.allSettled(
      (penalties ?? []).map((penalty: any) =>
        retryPenaltyCharge(supabase, penalty, max_attempts),
      ),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return {
      processed: penalties?.length ?? 0,
      successful,
      failed,
    };
  })();
}

async function retryPenaltyCharge(
  supabase: any,
  penalty: any,
  maxAttempts: number,
) {
  try {
    const stripe = await import("https://esm.sh/stripe@15.0.0");
    const stripeClient = stripe.default(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-01-27.acacia",
      httpClient: stripe.fetchAdapter(),
    });

    const customerId = penalty.profiles?.stripe_customer_id;
    if (!customerId) {
      throw new Error("No Stripe customer ID found");
    }

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: penalty.amount,
      currency: penalty.currency || "usd",
      customer: customerId,
      description: `Penalty retry: ${penalty.reason || "Goal penalty"}`,
      metadata: {
        goal_id: penalty.goal_id,
        penalty_id: penalty.id,
        type: "goal_penalty_retry",
      },
    });

    const confirmedIntent = await stripeClient.paymentIntents.confirm(
      paymentIntent.id,
    );

    await supabase
      .from("penalty_charges")
      .update({
        status: "charged",
        stripe_charge_id: confirmedIntent.id,
        charged_at: new Date().toISOString(),
        charge_attempts: (penalty.charge_attempts ?? 0) + 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", penalty.id);

    await supabase.from("notifications").insert({
      user_id: penalty.user_id,
      type: "penalty_charged",
      title: "Penalty Charged",
      message: `A penalty of $${(penalty.amount / 100).toFixed(2)} was charged for goal: ${penalty.goals?.title ?? "your goal"}.`,
      metadata: {
        goal_id: penalty.goal_id,
        charge_id: confirmedIntent.id,
        amount: penalty.amount,
      },
    });

    return { success: true, penaltyId: penalty.id };
  } catch (error) {
    const attemptCount = (penalty.charge_attempts ?? 0) + 1;
    await supabase
      .from("penalty_charges")
      .update({
        charge_attempts: attemptCount,
        last_attempt_at: new Date().toISOString(),
        ...(attemptCount >= maxAttempts
          ? { status: "failed" }
          : { status: "pending" }),
      })
      .eq("id", penalty.id);

    throw error;
  }
}
