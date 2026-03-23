// app/api/stripe/attach-payment-method/route.ts
import { stripe } from "@/lib/stripe/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { paymentMethodId, customerId } = await request.json();
    console.log(
      "Attaching payment method:",
      paymentMethodId,
      "to customer:",
      customerId,
    );

    // Attach payment method to customer
    const res = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });
    console.log("Payment method attached:", res);

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Attach payment method error:", error);
    return NextResponse.json(
      { error: "Failed to attach payment method" },
      { status: 500 },
    );
  }
}
