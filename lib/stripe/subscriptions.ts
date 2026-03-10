// lib/stripe/subscriptions.ts
import { stripe } from "./client";
import type Stripe from "stripe";
import { Result, tryCatch } from "@/lib/fp-utils";

export interface SubscriptionData {
  customerId: string;
  penaltyAmount: number;
  recurrence: "none" | "day" | "month" | "week";
  frequency: number;
  goalTitle: string;
  metadata?: Record<string, string>;
}

const DEFAULT_CURRENCY = "usd";

const getInvoiceClientSecret = (
  latestInvoice: string | Stripe.Invoice | null,
): string | undefined => {
  if (!latestInvoice || typeof latestInvoice === "string") {
    return undefined;
  }

  return latestInvoice.confirmation_secret?.client_secret ?? undefined;
};

const getOrCreateGoalPenaltyProduct = async (
  customerId: string,
  goalTitle: string,
) => {
  const productResult = await stripe.products.search({
    query: `active:\'true\' AND metadata[\'user_id\']:\'${customerId}\' AND metadata[\'type\']:\'goal_penalty\'`,
    limit: 1,
  });

  if (productResult.data.length > 0) {
    return productResult.data[0].id;
  }

  const product = await stripe.products.create({
    name: `LOCKED Penalties - ${goalTitle}`,
    description: "Accountability goal penalty charges",
    metadata: {
      user_id: customerId,
      type: "goal_penalty",
      goal_title: goalTitle,
    },
  });

  return product.id;
};

const createGoalPenaltyPrice = async (
  productId: string,
  data: SubscriptionData,
) => {
  return stripe.prices.create({
    product: productId,
    unit_amount: data.penaltyAmount,
    currency: DEFAULT_CURRENCY,
    recurring:
      data.recurrence !== "none"
        ? {
            interval: data.recurrence,
            interval_count: data.frequency,
          }
        : undefined,
    metadata: {
      goal_type: "penalty",
      recurrence: data.recurrence,
      frequency: String(data.frequency),
      ...data.metadata,
    },
  });
};

// Create subscription for recurring goal penalties
export const createStripeSubscription = async (
  data: SubscriptionData,
): Promise<
  Result<{
    subscriptionId: string;
    priceId: string;
    clientSecret?: string;
    requiresAction: boolean;
  }>
> => {
  return tryCatch(async () => {
    const productId = await getOrCreateGoalPenaltyProduct(
      data.customerId,
      data.goalTitle,
    );
    const price = await createGoalPenaltyPrice(productId, data);

    // For non-recurring goals, we use payment intents for one-time authorization.
    if (data.recurrence === "none") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.penaltyAmount,
        currency: DEFAULT_CURRENCY,
        customer: data.customerId,
        capture_method: "manual",
        description: `Penalty authorization for goal: ${data.goalTitle}`,
        metadata: {
          type: "penalty_authorization",
          ...data.metadata,
        },
      });

      return {
        subscriptionId: paymentIntent.id,
        priceId: price.id,
        clientSecret: paymentIntent.client_secret || undefined,
        requiresAction:
          paymentIntent.status === "requires_action" ||
          paymentIntent.status === "requires_confirmation",
      };
    }

    const subscription = await stripe.subscriptions.create({
      customer: data.customerId,
      items: [{ price: price.id }],
      payment_behavior: "default_incomplete",
      expand: ["latest_invoice.confirmation_secret"],
      metadata: {
        type: "goal_penalty_subscription",
        ...data.metadata,
      },
    });

    const clientSecret = getInvoiceClientSecret(subscription.latest_invoice);

    return {
      subscriptionId: subscription.id,
      priceId: price.id,
      clientSecret,
      requiresAction:
        subscription.status === "incomplete" ||
        subscription.status === "past_due",
    };
  }, "Failed to create Stripe subscription");
};

// Cancel subscription when goal is completed or cancelled
export const cancelGoalSubscription = async (
  subscriptionId: string,
): Promise<Result<{ canceled: boolean; cancellationDate: Date }>> => {
  return tryCatch(async () => {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);

    return {
      canceled: subscription.status === "canceled",
      cancellationDate: new Date(subscription.canceled_at || Date.now()),
    };
  }, "Failed to cancel Stripe subscription");
};

// Update subscription amount
export const updateSubscriptionAmount = async (
  subscriptionId: string,
  newAmount: number,
): Promise<Result<{ updated: boolean }>> => {
  return tryCatch(async () => {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const firstItem = subscription.items.data[0];

    if (!firstItem) {
      throw new Error("Subscription has no items to update");
    }

    const recurring = firstItem.price.recurring;
    if (!recurring) {
      throw new Error("Subscription item price is not recurring");
    }

    const productId =
      typeof firstItem.price.product === "string"
        ? firstItem.price.product
        : firstItem.price.product.id;

    await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: firstItem.id,
          price_data: {
            currency: DEFAULT_CURRENCY,
            product: productId,
            unit_amount: newAmount,
            recurring: {
              interval: recurring.interval,
              interval_count: recurring.interval_count,
            },
          },
        },
      ],
    });

    return { updated: true };
  }, "Failed to update subscription amount");
};
