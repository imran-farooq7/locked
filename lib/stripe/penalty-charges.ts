// lib/stripe/penalty-charges.ts
import { stripe } from "./client";
import { createSupabaseClient } from "@/lib/supabase/client";
import type Stripe from "stripe";
import { Result, tryCatch } from "@/lib/fp-utils";

export interface PenaltyChargeData {
  goalId: string;
  userId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, string>;
}

type ChargeResult = {
  chargeId: string;
  invoiceId?: string;
  amount: number;
  status: string;
  receiptUrl?: string;
};

const nowIso = () => new Date().toISOString();

const buildMetadata = (data: PenaltyChargeData) => ({
  goal_id: data.goalId,
  type: "penalty_charge",
  ...data.metadata,
});

type InvoiceWithPayment = Stripe.Invoice & {
  payment_intent?: string | Stripe.PaymentIntent | null;
  charge?: string | Stripe.Charge | null;
};

const getChargeIdFromInvoice = (invoice: InvoiceWithPayment) => {
  const paymentIntent = invoice.payment_intent;
  if (typeof paymentIntent === "string") return paymentIntent;
  if (paymentIntent?.id) return paymentIntent.id;

  const charge = invoice.charge;
  if (typeof charge === "string") return charge;
  if (charge?.id) return charge.id;

  throw new Error("Invoice payment did not return a charge or payment intent");
};

const insertPenaltyChargeRecord = async (
  data: PenaltyChargeData,
  chargeResult: ChargeResult,
) => {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("penalty_charges").insert({
    goal_id: data.goalId,
    user_id: data.userId,
    amount: data.amount,
    currency: "usd",
    stripe_charge_id: chargeResult.chargeId,
    stripe_invoice_id: chargeResult.invoiceId,
    status: "charged",
    reason: data.reason,
    due_date: nowIso(),
    charged_at: nowIso(),
  });

  if (error) throw error;
};

// Process penalty charge for failed goal
export const processPenaltyCharge = async (
  data: PenaltyChargeData,
): Promise<
  Result<ChargeResult>
> => {
  return tryCatch(async () => {
    const supabase = createSupabaseClient();

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", data.userId)
      .single();

    if (profileError) throw profileError;
    if (!profile?.stripe_customer_id) {
      throw new Error("User does not have a Stripe customer ID");
    }

    // Check for existing subscription
    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .select("stripe_subscription_id, stripe_price_id")
      .eq("id", data.goalId)
      .single();

    if (goalError) throw goalError;

    let chargeResult: ChargeResult;

    if (goal?.stripe_subscription_id) {
      // For recurring goals with existing subscription
      chargeResult = await chargeExistingSubscription(
        goal.stripe_subscription_id,
        data,
      );
    } else {
      // For one-time goals, create invoice item and invoice
      chargeResult = await createOneTimeCharge(
        profile.stripe_customer_id,
        data,
      );
    }

    // Record the charge in database
    await insertPenaltyChargeRecord(data, chargeResult);

    return chargeResult;
  }, "Failed to process penalty charge");
};

// Charge existing subscription
const chargeExistingSubscription = async (
  subscriptionId: string,
  data: PenaltyChargeData,
) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Create an invoice for the penalty
  const invoice = await stripe.invoices.create({
    customer: subscription.customer as string,
    subscription: subscriptionId,
    description: `Penalty charge: ${data.reason}`,
    metadata: buildMetadata(data),
  });

  // Finalize and pay the invoice
  const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
  const paidInvoice = (await stripe.invoices.pay(finalizedInvoice.id, {
    expand: ["payment_intent", "charge"],
  })) as InvoiceWithPayment;

  return {
    chargeId: getChargeIdFromInvoice(paidInvoice),
    invoiceId: paidInvoice.id,
    amount: data.amount,
    status: paidInvoice.status ?? "unknown",
    receiptUrl: paidInvoice.hosted_invoice_url || undefined,
  };
};

// Create one-time charge
const createOneTimeCharge = async (
  customerId: string,
  data: PenaltyChargeData,
) => {
  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: data.amount,
    currency: "usd",
    customer: customerId,
    description: `Penalty charge: ${data.reason}`,
    metadata: buildMetadata(data),
  });

  // Confirm and capture the payment
  const confirmedIntent = await stripe.paymentIntents.confirm(
    paymentIntent.id,
    {
      payment_method: "pm_card_visa", // In production, use saved payment method
    },
  );

  return {
    chargeId: confirmedIntent.id,
    amount: data.amount,
    status: confirmedIntent.status,
    receiptUrl: `https://dashboard.stripe.com/payments/${confirmedIntent.id}`,
  };
};

// Refund a penalty charge
export const refundPenaltyCharge = async (
  chargeId: string,
  reason?: string,
): Promise<Result<{ refundId: string; amount: number }>> => {
  return tryCatch(async () => {
    const refundReason =
      reason === "duplicate" ||
      reason === "fraudulent" ||
      reason === "requested_by_customer"
        ? reason
        : undefined;

    const refund = await stripe.refunds.create({
      charge: chargeId,
      reason: refundReason,
    });

    // Update database record
    const supabase = createSupabaseClient();
    await supabase
      .from("penalty_charges")
      .update({
        status: "refunded",
        updated_at: nowIso(),
      })
      .eq("stripe_charge_id", chargeId);

    return {
      refundId: refund.id,
      amount: refund.amount,
    };
  }, "Failed to process refund");
};

// Check charge status
export const getChargeStatus = async (
  chargeId: string,
): Promise<
  Result<{
    status: string;
    amount: number;
    captured: boolean;
    refunded: boolean;
    receiptUrl?: string;
  }>
> => {
  return tryCatch(async () => {
    const charge = await stripe.charges.retrieve(chargeId);

    return {
      status: charge.status,
      amount: charge.amount,
      captured: charge.captured,
      refunded: charge.refunded,
      receiptUrl: charge.receipt_url || undefined,
    };
  }, "Failed to retrieve charge status");
};
