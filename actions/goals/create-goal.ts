// actions/goals/create-goal.ts
"use server";

import { calculateNextCheckin } from "@/lib/goal-utils";
// import { createStripeSubscription } from "@/lib/stripe/subscriptions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Validate incoming form data (coerce types from FormData)
const createGoalSchema = z
  .object({
    title: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable(),
    targetDate: z
      .preprocess((v) => (typeof v === "string" ? v : String(v)), z.string())
      .refine(
        (date) => {
          const selected = new Date(date);
          if (Number.isNaN(selected.getTime())) return false;
          const tomorrow = new Date();
          tomorrow.setHours(0, 0, 0, 0);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return selected >= tomorrow;
        },
        { message: "Target date must be at least tomorrow" },
      ),

    // Penalty is stored as integer cents (100 = $1.00)
    penaltyAmount: z.preprocess(
      (v) => Number(v),
      z.number().int().min(100).max(50000),
    ),

    proofRequired: z
      .preprocess((v) => v === "true" || v === true, z.boolean())
      .default(false),
    proofType: z.preprocess(
      (v) => (typeof v === "string" ? v : undefined),
      z.enum(["text", "image", "file"]).optional(),
    ),

    recurrence: z.preprocess(
      (v) => (typeof v === "string" ? v : "none"),
      z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
    ),
    frequency: z.preprocess(
      (v) => Number(v || 1),
      z.number().int().min(1).max(30).default(1),
    ),
  })
  .superRefine((val, ctx) => {
    if (val.proofRequired && !val.proofType) {
      ctx.addIssue({
        path: ["proofType"],
        code: z.ZodIssueCode.custom,
        message: "proofType is required when proofRequired is true",
      });
    }
  });

export async function createGoalAction(formData: FormData) {
  const todo = { success: false } as any;

  const supabase = await createSupabaseServerClient();

  // ensure authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // fetch profile for stripe customer id (if payments are needed later)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile lookup failed:", profileError);
    throw profileError;
  }

  if (!profile?.stripe_customer_id) {
    // don't fail validation here — surface a clear message
    throw new Error(
      "Stripe customer not found. Please update your payment information.",
    );
  }

  // Build a plain object from FormData and let Zod coerce types
  const obj = Object.fromEntries(formData.entries());

  const parsed = createGoalSchema.safeParse(obj);
  if (!parsed.success) {
    return { success: false, errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  try {
    // TODO: create Stripe subscription if implementing recurring penalties
    // const stripeSubscription = await createStripeSubscription({ ... });

    // Insert goal into DB. Use ISO strings for dates and store penalty in cents.
    const targetIso = new Date(data.targetDate).toISOString();

    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        title: data.title,
        description: data.description ?? null,
        target_date: targetIso,
        penalty_amount: data.penaltyAmount,
        currency: "usd",
        status: "active",
        proof_required: data.proofRequired,
        proof_type: data.proofType ?? null,
        // stripe_subscription_id: stripeSubscription?.id ?? null,
        // stripe_price_id: stripeSubscription?.priceId ?? null,
      })
      .select()
      .single();

    if (goalError) throw goalError;

    // Calculate the first check-in using a Date (goal.target_date should be an ISO string)
    const nextCheckin = calculateNextCheckin(
      new Date(goal.target_date),
      data.recurrence,
    );

    await supabase.from("goal_checkins").insert({
      goal_id: goal.id,
      user_id: user.id,
      due_at: nextCheckin.toISOString(),
      status: "pending",
    });

    revalidatePath("/dashboard/goals");
    return { success: true, goalId: goal.id };
  } catch (error) {
    console.error("Goal creation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
