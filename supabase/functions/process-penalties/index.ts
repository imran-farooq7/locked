// supabase/functions/process-penalties/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  createEdgeSupabaseClient,
  handleCors,
} from "../_shared/cors.ts";

const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

interface PenaltyJob {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  reason: string;
  charge_attempts: number;
  stripe_customer_id: string;
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Verify API key
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = authHeader.split("Bearer ")[1];
  if (apiKey !== Deno.env.get("CRON_SECRET")) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createEdgeSupabaseClient(req);

    // Get pending penalties due for processing
    const { data: pendingPenalties, error: fetchError } = await supabase
      .from("penalty_charges")
      .select(
        `
        *,
        profiles(stripe_customer_id),
        goals(title, recurrence)
      `,
      )
      .eq("status", "pending")
      .lte("due_date", new Date().toISOString())
      .lt("charge_attempts", MAX_RETRIES)
      .order("due_date", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) throw fetchError;

    const results = await Promise.allSettled(
      pendingPenalties.map((penalty) => processPenalty(supabase, penalty)),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return new Response(
      JSON.stringify({
        processed: pendingPenalties.length,
        successful,
        failed,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Penalty processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processPenalty(supabase: any, penalty: any) {
  try {
    // Initialize Stripe
    const stripe = await import("https://esm.sh/stripe@15.0.0");
    const stripeClient = stripe.default(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-01-27.acacia",
      httpClient: stripe.fetchAdapter(),
    });

    const customerId = penalty.profiles?.stripe_customer_id;
    if (!customerId) {
      throw new Error("No Stripe customer ID found");
    }

    // Create payment intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: penalty.amount,
      currency: penalty.currency || "usd",
      customer: customerId,
      description: `Penalty: ${penalty.reason}`,
      metadata: {
        goal_id: penalty.goal_id,
        penalty_id: penalty.id,
        type: "goal_penalty",
      },
    });

    // Attempt to confirm the payment
    const confirmedIntent = await stripeClient.paymentIntents.confirm(
      paymentIntent.id,
    );

    // Update database on success
    await supabase
      .from("penalty_charges")
      .update({
        status: "charged",
        stripe_charge_id: confirmedIntent.id,
        charged_at: new Date().toISOString(),
        charge_attempts: penalty.charge_attempts + 1,
      })
      .eq("id", penalty.id);

    // Create notification
    await supabase.from("notifications").insert({
      user_id: penalty.user_id,
      type: "penalty_charged",
      title: "Penalty Charged",
      message: `A penalty of $${(penalty.amount / 100).toFixed(2)} was charged for goal: ${penalty.goals.title}`,
      metadata: {
        goal_id: penalty.goal_id,
        charge_id: confirmedIntent.id,
        amount: penalty.amount,
      },
    });

    return { success: true, penaltyId: penalty.id };
  } catch (error) {
    console.error(`Failed to process penalty ${penalty.id}:`, error);

    // Update attempt count
    await supabase
      .from("penalty_charges")
      .update({
        charge_attempts: penalty.charge_attempts + 1,
        last_attempt_at: new Date().toISOString(),
        ...(penalty.charge_attempts + 1 >= MAX_RETRIES
          ? { status: "failed" }
          : {}),
      })
      .eq("id", penalty.id);

    throw error;
  }
}
