// app/api/cron/send-daily-summaries/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  try {
    // Get all active users
    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .eq("is_active", true);

    if (error) throw error;

    const results = [];

    for (const user of users || []) {
      // Get user's goals
      const { data: goals } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id);

      const userGoals = goals || [];

      const activeGoals = userGoals.filter((g: any) => g.status === "active");
      const completedToday = userGoals.filter(
        (g: any) =>
          g.status === "completed" &&
          new Date(g.target_date).toDateString() === new Date().toDateString(),
      );
      const upcomingDeadlines = userGoals.filter(
        (g: any) =>
          g.status === "active" &&
          new Date(g.target_date) <=
            new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      );

      // Skip if no activity
      if (
        activeGoals.length === 0 &&
        completedToday.length === 0 &&
        upcomingDeadlines.length === 0
      ) {
        continue;
      }

      try {
        // Create notification
        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "daily_summary",
          title: "Daily Goal Summary",
          message: `You have ${activeGoals.length} active goals and ${upcomingDeadlines.length} upcoming deadlines.`,
          metadata: {
            active_goals: activeGoals.length,
            completed_today: completedToday.length,
            upcoming_deadlines: upcomingDeadlines.length,
          },
        });

        results.push({ user_id: user.id, status: "summary_sent" });
      } catch (summaryError: any) {
        console.error(
          `Failed to send summary to user ${user.id}:`,
          summaryError,
        );
        results.push({
          user_id: user.id,
          status: "failed",
          error: summaryError.message,
        });
      }
    }

    // Log cron execution
    await supabase.from("cron_logs").insert({
      job_name: "send-daily-summaries",
      status: "success",
      processed: users?.length || 0,
      executed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      processed: users?.length || 0,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Send daily summaries error:", error);

    await supabase.from("cron_logs").insert({
      job_name: "send-daily-summaries",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executed_at: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Failed to send daily summaries" },
      { status: 500 },
    );
  }
}
