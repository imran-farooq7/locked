// app/api/stripe/webhook/route.ts
import { stripe } from "@/lib/stripe/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  try {
    switch (event.type) {
      // Payment success events
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
          supabase,
        );
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice, supabase);
        break;

      case "charge.succeeded":
        await handleChargeSucceeded(
          event.data.object as Stripe.Charge,
          supabase,
        );
        break;

      // Payment failure events
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
          supabase,
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
          supabase,
        );
        break;

      // Subscription events
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
          supabase,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
          supabase,
        );
        break;

      // Refund events
      case "charge.refunded":
        await handleChargeRefunded(
          event.data.object as Stripe.Charge,
          supabase,
        );
        break;

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

// Event handlers
const handlePaymentIntentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent,
  supabase: any,
) => {
  const metadata = paymentIntent.metadata;

  if (metadata.type === "penalty_charge") {
    // Update penalty charge status
    await supabase
      .from("penalty_charges")
      .update({
        status: "charged",
        stripe_charge_id: paymentIntent.id,
        charged_at: new Date().toISOString(),
      })
      .eq("goal_id", metadata.goal_id);
  }
};

const handleInvoicePaid = async (invoice: Stripe.Invoice, supabase: any) => {
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  const subscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;

  if (subscriptionId) {
    // This is a recurring penalty payment
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const goalId = subscription.metadata.goal_id;
    if (goalId) {
      // Record the payment
      await supabase.from("penalty_charges").insert({
        goal_id: goalId,
        user_id: subscription.metadata.user_id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        stripe_charge_id: invoice.id as string,
        stripe_invoice_id: invoice.id,
        status: "charged",
        reason: "Recurring penalty charge",
        due_date: new Date(
          invoice.due_date || invoice.created * 1000,
        ).toISOString(),
        charged_at: new Date().toISOString(),
      });
    }
  }
};

const handlePaymentIntentFailed = async (
  paymentIntent: Stripe.PaymentIntent,
  supabase: any,
) => {
  const metadata = paymentIntent.metadata;

  if (metadata.type === "penalty_charge") {
    // Mark penalty as failed
    await supabase
      .from("penalty_charges")
      .update({
        status: "failed",
        charge_attempts: 3, // Max attempts reached
      })
      .eq("goal_id", metadata.goal_id);
  }
};

const handleSubscriptionDeleted = async (
  subscription: Stripe.Subscription,
  supabase: any,
) => {
  const goalId = subscription.metadata.goal_id;
  if (goalId) {
    // Update goal status if subscription was cancelled
    await supabase
      .from("goals")
      .update({
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", goalId);
  }
};
const handleChargeSucceeded = async (charge: Stripe.Charge, supabase: any) => {
  // Log charge for reconciliation
  await supabase.from("charges").insert({
    stripe_charge_id: charge.id,
    amount: charge.amount,
    currency: charge.currency,
    status: charge.status,
    payment_intent: charge.payment_intent,
    invoice_id: charge.id,
    receipt_url: charge.receipt_url,
    created_at: new Date().toISOString(),
  });
};
const handleInvoicePaymentFailed = async (
  invoice: Stripe.Invoice,
  supabase: any,
) => {
  const subscriptionRef = invoice.parent?.subscription_details?.subscription;
  const subscriptionId =
    typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
  const subscription = subscriptionId
    ? await stripe.subscriptions.retrieve(subscriptionId)
    : null;

  const userId = subscription?.metadata?.user_id;

  if (userId) {
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "invoice_payment_failed",
      title: "Payment Failed",
      message: `Your invoice payment of $${(invoice.amount_due / 100).toFixed(2)} failed. Please update your payment method.`,
      metadata: {
        invoice_id: invoice.id,
        amount: invoice.amount_due,
      },
    });
  }

  await supabase
    .from("invoices")
    .update({
      status: "payment_failed",
      failure_message: invoice.last_finalization_error?.message,
    })
    .eq("stripe_invoice_id", invoice.id);
};
const handleSubscriptionUpdated = async (
  subscription: Stripe.Subscription,
  supabase: any,
) => {
  const goalId = subscription.metadata.goal_id;

  if (goalId) {
    await supabase
      .from("goals")
      .update({
        subscription_status: subscription.status,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);
  }
};
const handleChargeRefunded = async (charge: Stripe.Charge, supabase: any) => {
  // Find and update the penalty charge
  const { data: penalty } = await supabase
    .from("penalty_charges")
    .update({
      status: "refunded",
    })
    .eq("stripe_charge_id", charge.id)
    .select("user_id, goal_id")
    .single();

  if (penalty) {
    // Create refund record
    await supabase.from("refunds").insert({
      stripe_charge_id: charge.id,
      amount: charge.amount_refunded,
      reason: charge.refunds?.data[0]?.reason,
      status: "completed",
      user_id: penalty.user_id,
      goal_id: penalty.goal_id,
      created_at: new Date().toISOString(),
    });

    // Notify user
    await supabase.from("notifications").insert({
      user_id: penalty.user_id,
      type: "refund_processed",
      title: "Refund Processed",
      message: `Your refund of $${(charge.amount_refunded / 100).toFixed(2)} has been processed.`,
      metadata: {
        charge_id: charge.id,
        amount: charge.amount_refunded,
      },
    });
  }
};
