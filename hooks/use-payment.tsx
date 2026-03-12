import { createSupabaseClient } from "@/lib/supabase/client";
import { useCallback, useMemo, useState, useTransition } from "react";
export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  isDefault: boolean;
}
export const usePaymentMethods = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isPending, startTransition] = useTransition();

  const supabase = useMemo(() => createSupabaseClient(), []);

  const loadPaymentMethods = useCallback(() => {
    startTransition(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("stripe_customer_id")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Profile lookup failed:", error);
          return;
        }

        if (profile?.stripe_customer_id) {
          // In production, fetch from Stripe API
          // For demo, show mock data
          setMethods([
            {
              id: "pm_1",
              brand: "visa",
              last4: "4242",
              exp_month: 12,
              exp_year: 2025,
              isDefault: true,
            },
            {
              id: "pm_2",
              brand: "mastercard",
              last4: "8888",
              exp_month: 6,
              exp_year: 2024,
              isDefault: false,
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to load payment methods:", error);
      }
    });
  }, [supabase]);

  const addPaymentMethod = () => {
    // This would integrate with Stripe Elements
    // For demo, add a mock method
    setMethods((prev) => [
      ...prev,
      {
        id: `pm_${Date.now()}`,
        brand: "amex",
        last4: "1234",
        exp_month: 3,
        exp_year: 2026,
        isDefault: false,
      },
    ]);
  };

  const removePaymentMethod = (methodId: string) => {
    // Confirm removal
    if (!confirm("Are you sure you want to remove this payment method?")) {
      return;
    }

    // Don't allow removing the last method
    if (methods.length <= 1) {
      alert("You must have at least one payment method");
      return;
    }

    // Don't allow removing default method if others exist
    const method = methods.find((m) => m.id === methodId);
    if (method?.isDefault && methods.length > 1) {
      alert("Please set another method as default before removing this one");
      return;
    }

    setMethods((prev) => prev.filter((m) => m.id !== methodId));
  };

  const setDefaultMethod = (methodId: string) => {
    setMethods((prev) =>
      prev.map((method) => ({
        ...method,
        isDefault: method.id === methodId,
      })),
    );
  };

  return {
    methods,
    isPending,
    loadPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultMethod,
  };
};
