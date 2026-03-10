// lib/stripe/products.ts
import { stripe } from "./client";
import type Stripe from "stripe";
import { Result, tryCatch } from "@/lib/fp-utils";

export interface GoalPriceConfig {
  penaltyAmount: number; // in cents
  recurrence: "none" | "daily" | "weekly" | "monthly";
  frequency: number;
  goalTitle: string;
  currency?: string;
}

// Pure function to generate price description
export const generatePriceDescription = (config: GoalPriceConfig): string => {
  const amount = (config.penaltyAmount / 100).toFixed(2);
  const currency = config.currency || "usd";

  if (config.recurrence === "none") {
    return `One-time penalty of ${amount} ${currency.toUpperCase()} for goal: ${config.goalTitle}`;
  }

  const frequencyMap = {
    daily: "day",
    weekly: "week",
    monthly: "month",
  };

  const interval =
    config.frequency > 1
      ? `${config.frequency} ${frequencyMap[config.recurrence]}s`
      : frequencyMap[config.recurrence];

  return `Recurring penalty of ${amount} ${currency.toUpperCase()} every ${interval} for goal: ${config.goalTitle}`;
};

// Create or get Stripe product for goal penalties
export const getOrCreateGoalProduct = async (
  userId: string,
): Promise<Result<{ productId: string }>> => {
  return tryCatch(async () => {
    const productName = `LOCKED Penalties - User ${userId.substring(0, 8)}`;

    // Search for existing product
    const products = await stripe.products.search({
      query: `active:\'true\' AND name:\'${productName}\'`,
      limit: 1,
    });

    if (products.data.length > 0) {
      return { productId: products.data[0].id };
    }

    // Create new product
    const product = await stripe.products.create({
      name: productName,
      description: "Accountability goal penalties",
      metadata: {
        user_id: userId,
        type: "goal_penalty",
      },
    });

    return { productId: product.id };
  }, "Failed to create Stripe product");
};

// Create price for a specific goal
export const createGoalPrice = async (
  productId: string,
  config: GoalPriceConfig,
): Promise<Result<{ priceId: string; unitAmount: number }>> => {
  return tryCatch(async () => {
    const recurrenceToInterval: Record<
      Exclude<GoalPriceConfig["recurrence"], "none">,
      Stripe.PriceCreateParams.Recurring.Interval
    > = {
      daily: "day",
      weekly: "week",
      monthly: "month",
    };

    const priceData: Stripe.PriceCreateParams = {
      product: productId,
      unit_amount: config.penaltyAmount,
      currency: config.currency || "usd",
      metadata: {
        goal_type: "penalty",
        recurrence: config.recurrence,
        frequency: String(config.frequency),
      },
    };

    // Configure recurrence
    if (config.recurrence !== "none") {
      priceData.recurring = {
        interval: recurrenceToInterval[config.recurrence],
        interval_count: config.frequency,
      };
    }

    const price = await stripe.prices.create(priceData);

    return {
      priceId: price.id,
      unitAmount: config.penaltyAmount,
    };
  }, "Failed to create Stripe price");
};
