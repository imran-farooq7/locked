// app/api/cron/process-penalties/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const BATCH_SIZE = 50;
  const MAX_RETRIES = 3;

  try {
    // Get pending penalties - use type assertion
    const { data: penalties, error } = (await supabase
      .from("penalty_charges")
      .select(
        `
        *,
        profiles!inner (
          stripe_customer_id
        ),
        goals!inner (
          title
        )
      `,
      )
      .eq("status", "pending")
      .lte("due_date", new Date().toISOString())
      .lt("charge_attempts", MAX_RETRIES)
      .limit(BATCH_SIZE)) as any;

    if (error) throw error;

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const penalty of penalties || []) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: penalty.amount,
          currency: penalty.currency || "usd",
          customer: penalty.profiles?.stripe_customer_id,
          description: `Penalty for goal: ${penalty.goals?.title}`,
          metadata: {
            goal_id: penalty.goal_id,
            penalty_id: penalty.id,
            user_id: penalty.user_id,
            type: "penalty_charge",
          },
        });

        const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id);

        // Update penalty charge status
        await supabase
          .from("penalty_charges")
          .update({
            status: "charged",
            stripe_charge_id: confirmed.id,
            charged_at: new Date().toISOString(),
            charge_attempts: penalty.charge_attempts + 1,
          })
          .eq("id", penalty.id);

        // Create notification - use raw query to avoid type issues
        await supabase.from("notifications").insert({
          user_id: penalty.user_id,
          type: "penalty_charged",
          title: "Penalty Charged",
          message: `A penalty of $${(penalty.amount / 100).toFixed(2)} was charged for your goal: ${penalty.goals?.title}`,
          metadata: {
            goal_id: penalty.goal_id,
            charge_id: confirmed.id,
            amount: penalty.amount,
          },
        } as any);

        results.push({ id: penalty.id, status: "charged" });
        successful++;
      } catch (chargeError: any) {
        console.error(`Failed to charge penalty ${penalty.id}:`, chargeError);

        const newAttempts = penalty.charge_attempts + 1;
        const newStatus = newAttempts >= MAX_RETRIES ? "failed" : "pending";

        await supabase
          .from("penalty_charges")
          .update({
            charge_attempts: newAttempts,
            last_attempt_at: new Date().toISOString(),
            status: newStatus,
          })
          .eq("id", penalty.id);

        if (newStatus === "failed") {
          await supabase.from("notifications").insert({
            user_id: penalty.user_id,
            type: "penalty_failed",
            title: "Penalty Charge Failed",
            message: `We were unable to charge the penalty for your goal: ${penalty.goals?.title}. Please update your payment method.`,
            metadata: {
              goal_id: penalty.goal_id,
              amount: penalty.amount,
            },
          } as any);
        }

        results.push({
          id: penalty.id,
          status: newStatus,
          error: chargeError.message,
        });
        failed++;
      }
    }

    // Log cron execution - use raw query for cron_logs
    await supabase.from("cron_logs").insert({
      job_name: "process-penalties",
      status: "success",
      processed: penalties?.length || 0,
      successful,
      failed,
      executed_at: new Date().toISOString(),
    } as any);

    return NextResponse.json({
      success: true,
      processed: penalties?.length || 0,
      successful,
      failed,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Process penalties error:", error);

    await supabase.from("cron_logs").insert({
      job_name: "process-penalties",
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
      executed_at: new Date().toISOString(),
    } as any);

    return NextResponse.json(
      { error: "Failed to process penalties" },
      { status: 500 },
    );
  }
}
