import { PaymentRecord } from "@/components/payments/payment-history";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useState, useTransition } from "react";

const usePaymentHistory = (limit: number) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isPending, startTransition] = useTransition();

  const supabase = createSupabaseClient();

  const loadPayments = (filter: string) => {
    startTransition(async () => {
      let query = supabase
        .from("penalty_charges")
        .select(
          `
          *,
          goal:goals(title, id)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (!error && data) {
        setPayments(data as PaymentRecord[]);
      }
    });
  };

  const downloadReceipt = (chargeId: string) => {
    // This would fetch receipt from Stripe API
    alert(`Receipt for charge ${chargeId} would be downloaded`);
  };

  return {
    payments,
    isPending,
    loadPayments,
    downloadReceipt,
  };
};
export default usePaymentHistory;
