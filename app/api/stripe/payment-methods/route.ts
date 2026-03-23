// app/api/stripe/payment-methods/route.ts
import { stripe } from "@/lib/stripe/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Profile lookup failed:", error);
      return NextResponse.json(
        { error: "Profile lookup failed" },
        { status: 500 },
      );
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ methods: [] });
    }

    const [customer, paymentMethods] = await Promise.all([
      stripe.customers.retrieve(profile.stripe_customer_id),
      stripe.paymentMethods.list({
        customer: profile.stripe_customer_id,
        type: "card",
      }),
    ]);

    const defaultPaymentMethodId =
      typeof customer === "string"
        ? null
        : ((customer.invoice_settings?.default_payment_method ??
            null) as string | null);

    const methods = paymentMethods.data.flatMap((method) => {
      const card = method.card;
      if (!card) return [];
      return [
        {
          id: method.id,
          brand: card.brand ?? "card",
          last4: card.last4 ?? "0000",
          exp_month: card.exp_month ?? 0,
          exp_year: card.exp_year ?? 0,
          isDefault: method.id === defaultPaymentMethodId,
        },
      ];
    });

    return NextResponse.json({ methods });
  } catch (error) {
    console.error("List payment methods error:", error);
    return NextResponse.json(
      { error: "Failed to load payment methods" },
      { status: 500 },
    );
  }
}
