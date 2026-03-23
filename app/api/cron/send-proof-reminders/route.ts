// app/api/cron/send-proof-reminders/route.ts
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
    // Find goals due in next 24 hours that require proof
    const { data: goals, error } = await supabase
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
      .eq("proof_required", true)
      .gt("target_date", new Date().toISOString())
      .lte(
        "target_date",
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      );

    if (error) throw error;

    const results = [];

    for (const goal of goals || []) {
      try {
        // Create notification
        await supabase.from("notifications").insert({
          user_id: goal.user_id,
          type: "proof_reminder",
          title: "Proof Submission Reminder",
          message: `Your goal "${goal.title}" needs proof submission within 24 hours.`,
          metadata: {
            goal_id: goal.id,
            deadline: goal.target_date,
          },
        });

        results.push({ goal_id: goal.id, status: "reminder_sent" });
      } catch (reminderError: any) {
        console.error(
          `Failed to send reminder for goal ${goal.id}:`,
          reminderError,
        );
        results.push({
          goal_id: goal.id,
          status: "failed",
          error: reminderError.message,
        });
      }
    }

    // Log cron execution
    await supabase.from("cron_logs").insert({
      job_name: "send-proof-reminders",
      status: "success",
      processed: goals?.length || 0,
      executed_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      processed: goals?.length || 0,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Send proof reminders error:", error);

    await supabase.from("cron_logs").insert({
      job_name: "send-proof-reminders",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executed_at: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Failed to send proof reminders" },
      { status: 500 },
    );
  }
}
