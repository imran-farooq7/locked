// app/api/cron/check-expired-goals/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  try {
    // Find expired active goals
    const { data: expiredGoals, error } = await supabase
      .from("goals")
      .select(
        `
        *,
        profiles!goals_user_id_fkey (
          email,
          full_name
        )
      `,
      )
      .eq("status", "active")
      .lt("target_date", new Date().toISOString());

    if (error) throw error;

    const results = [];

    for (const goal of expiredGoals || []) {
      // Mark goal as failed
      await supabase
        .from("goals")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      // Create penalty charge record
      await supabase.from("penalty_charges").insert({
        goal_id: goal.id,
        user_id: goal.user_id,
        amount: goal.penalty_amount,
        currency: goal.currency || "usd",
        status: "pending",
        reason: "Goal deadline expired",
        due_date: new Date().toISOString(),
      });

      // Create notification
      await supabase.from("notifications").insert({
        user_id: goal.user_id,
        type: "goal_expired",
        title: "Goal Expired",
        message: `Your goal "${goal.title}" has expired. A penalty of $${(goal.penalty_amount / 100).toFixed(2)} will be charged.`,
        metadata: {
          goal_id: goal.id,
          amount: goal.penalty_amount,
        },
      });

      results.push({
        goal_id: goal.id,
        title: goal.title,
        status: "marked_failed",
      });
    }

    // Log cron execution
    await supabase.from("cron_logs").insert({
      job_name: "check-expired-goals",
      status: "success",
      processed: expiredGoals?.length || 0,
      executed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      processed: expiredGoals?.length || 0,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Check expired goals error:", error);

    await supabase.from("cron_logs").insert({
      job_name: "check-expired-goals",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executed_at: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Failed to check expired goals" },
      { status: 500 },
    );
  }
}
