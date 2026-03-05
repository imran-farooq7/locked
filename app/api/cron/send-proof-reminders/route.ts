// app/api/cron/send-proof-reminders/route.ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();

  try {
    // Get goals needing proof reminders
    const { data: goalsNeedingProof, error } = await supabase.rpc(
      "check_recurring_proofs",
    );

    if (error) throw error;

    // Send reminders for each goal
    const remindersSent = [];

    for (const goal of goalsNeedingProof) {
      // Get user email
      const { data: user } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", goal.user_id)
        .single();

      if (user?.email) {
        // Send email reminder
        await resend.emails.send({
          from: "LOCKED <notifications@locked.app>",
          to: user.email,
          subject:
            goal.status === "overdue"
              ? "⚠️ Proof Submission Overdue - Penalty Pending"
              : "🔔 Proof Submission Due Soon",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1>${goal.status === "overdue" ? "Proof Submission Overdue" : "Proof Reminder"}</h1>
              <p>Your recurring goal requires proof submission.</p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Status:</strong> ${goal.status === "overdue" ? "OVERDUE" : "DUE SOON"}</p>
                ${
                  goal.status === "overdue"
                    ? `<p><strong>Penalty:</strong> $${(goal.penalty_amount / 100).toFixed(2)} will be charged if not submitted within 24 hours</p>`
                    : `<p><strong>Due:</strong> Within 24 hours</p>`
                }
              </div>
              
              <a href="${process.env.NEXTAUTH_URL}/dashboard/goals/${goal.goal_id}" 
                 style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">
                Submit Proof Now
              </a>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                This is an automated reminder from LOCKED Accountability.
              </p>
            </div>
          `,
        });

        remindersSent.push({
          goal_id: goal.goal_id,
          user_id: goal.user_id,
          status: goal.status,
          email_sent: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      reminders_sent: remindersSent.length,
      details: remindersSent,
    });
  } catch (error) {
    console.error("Proof reminder error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send proof reminders",
      },
      { status: 500 },
    );
  }
}
