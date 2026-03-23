import { useCallback, useState, useTransition } from "react";
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

  const loadPaymentMethods = useCallback(() => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/stripe/payment-methods", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!response.ok) {
          console.error(
            "Failed to load payment methods:",
            response.status,
            await response.text(),
          );
          return;
        }

        const data = (await response.json()) as { methods?: PaymentMethod[] };
        setMethods(data.methods ?? []);
      } catch (error) {
        console.error("Failed to load payment methods:", error);
      }
    });
  }, []);

  const addPaymentMethod = () => {
    // Payment methods are added via Stripe Elements + API.
    // Call loadPaymentMethods after a successful add to refresh the list.
    loadPaymentMethods();
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
