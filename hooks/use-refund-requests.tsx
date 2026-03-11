import { createSupabaseClient } from "@/lib/supabase/client";
import { useState, useTransition } from "react";
const supabase = createSupabaseClient();

const useRefundRequest = (
  chargeId: string,
  goalTitle: string,
  amount: number,
  onSuccess?: () => void,
) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!reason.trim()) {
      setError("Please provide a reason for the refund request");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    startTransition(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { error: dbError } = await supabase
          .from("refund_requests")
          .insert({
            user_id: user.id,
            stripe_charge_id: chargeId,
            reason,
            status: "pending",
            amount,
            metadata: {
              goal_title: goalTitle,
            },
          });

        if (dbError) throw dbError;

        alert("Refund request submitted. We'll review it within 24-48 hours.");

        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  return {
    reason,
    setReason,
    error,
    isSubmitting: isSubmitting || isPending,
    submit,
  };
};
export default useRefundRequest;
