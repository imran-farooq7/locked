// actions/goals/create-goal.ts
"use server";

import { calculateNextCheckin } from "@/lib/goal-utils";
// import { createStripeSubscription } from "@/lib/stripe/subscriptions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Zod schema for goal validation
const createGoalSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  targetDate: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return selectedDate >= tomorrow;
  }, "Target date must be at least tomorrow"),

  penaltyAmount: z
    .number()
    .min(100, "Minimum penalty is $1.00")
    .max(50000, "Maximum penalty is $500.00"),

  proofRequired: z.boolean().default(false),
  proofType: z.enum(["text", "image", "file"]).optional(),

  // Recurrence options
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
  frequency: z.number().min(1).max(30).default(1),
});

export async function createGoalAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Get user profile for Stripe customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    throw new Error(
      "Stripe customer not found. Please update your payment information.",
    );
  }

  // Parse and validate form data
  const rawData = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    targetDate: formData.get("targetDate") as string,
    penaltyAmount: Number(formData.get("penaltyAmount")),
    proofRequired: formData.get("proofRequired") === "true",
    proofType: formData.get("proofType") as
      | "text"
      | "image"
      | "file"
      | undefined,
    recurrence: formData.get("recurrence") as
      | "none"
      | "daily"
      | "weekly"
      | "monthly",
    frequency: Number(formData.get("frequency")),
  };

  const validation = createGoalSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  const data = validation.data;

  try {
    // 1. Create Stripe subscription for recurring penalty
    // const stripeSubscription = await createStripeSubscription({
    //   customerId: profile.stripe_customer_id,
    //   penaltyAmount: data.penaltyAmount,
    //   recurrence: data.recurrence,
    //   frequency: data.frequency,
    //   goalTitle: data.title,
    // });

    // 2. Create goal in database
    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        target_date: data.targetDate,
        penalty_amount: data.penaltyAmount,
        currency: "usd",
        status: "active",
        proof_required: data.proofRequired,
        proof_type: data.proofType,
        // stripe_subscription_id: stripeSubscription.id,
        // stripe_price_id: stripeSubscription.priceId,
      })
      .select()
      .single();

    if (goalError) throw goalError;

    // 3. Create initial check-in deadline
    const nextCheckin = calculateNextCheckin(goal.target_date, data.recurrence);

    await supabase.from("goal_checkins").insert({
      goal_id: goal.id,
      user_id: user.id,
      due_at: nextCheckin.toDateString(),
      status: "pending",
    });

    revalidatePath("/dashboard/goals");
    return { success: true, goalId: goal.id };
  } catch (error) {
    console.error("Goal creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create goal",
    };
  }
}
