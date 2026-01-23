// actions/auth/signup.ts
"use server";

import { stripe } from "@/lib/stripe/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Constants
const DASHBOARD_PATH = "/dashboard";
const MIN_PASSWORD_LENGTH = 8;

// Validation schema
const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    ),
  fullName: z.string().max(255, "Name is too long").optional().default(""),
});

type SignupInput = z.infer<typeof signupSchema>;

// Separate concern: Create Stripe customer for new user
async function createStripeCustomer(userId: string, data: SignupInput) {
  return stripe.customers.create({
    email: data.email,
    name: data.fullName || undefined,
    metadata: {
      supabase_user_id: userId,
    },
  });
}

// Separate concern: Update user profile with Stripe customer ID
async function updateUserProfile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  stripeCustomerId: string,
  fullName: string,
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      stripe_customer_id: stripeCustomerId,
      full_name: fullName,
    })
    .eq("id", userId);

  if (error) throw error;
}

export async function signupAction(formData: FormData) {
  // 1. Validate input early (synchronous)
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    fullName: formData.get("fullName") as string,
  };

  const validationResult = signupSchema.safeParse(rawData);
  if (!validationResult.success) {
    return {
      success: false,
      errors: validationResult.error.flatten(),
    };
  }

  const data = validationResult.data;
  const supabase = await createSupabaseServerClient();

  try {
    // 2. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user?.id) {
      throw new Error("Failed to create user account");
    }

    const userId = authData.user.id;

    // 3. Create Stripe customer and update profile in parallel
    const [customer] = await Promise.all([
      createStripeCustomer(userId, data),
      updateUserProfile(supabase, userId, "", data.fullName), // Note: Stripe ID added in next step
    ]);

    // 4. Update profile with Stripe customer ID (requires customer ID)
    await updateUserProfile(supabase, userId, customer.id, data.fullName);

    // 5. Revalidate cache after successful signup (non-blocking)
    after(() => {
      revalidatePath(DASHBOARD_PATH);
    });

    return {
      success: true,
      message: "Signup successful. Check your email for confirmation link",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Signup failed";
    console.error("[Signup Error]", { error, email: data.email });

    return {
      success: false,
      error: errorMessage,
    };
  }
}
