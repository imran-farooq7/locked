// components/payments/refund-requests.tsx
"use client";

import useRefundRequest from "@/hooks/use-refund-requests";
import { RequestDetails } from "./RequestDetails";

interface RefundRequestProps {
  chargeId: string;
  goalTitle: string;
  amount: number;
  onSuccess?: () => void;
}

export default function RefundRequest({
  chargeId,
  goalTitle,
  amount,
  onSuccess,
}: RefundRequestProps) {
  const { reason, setReason, error, isSubmitting, submit } = useRefundRequest(
    chargeId,
    goalTitle,
    amount,
    onSuccess,
  );

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Request Refund</h3>

      <div className="space-y-4">
        <RequestDetails
          chargeId={chargeId}
          goalTitle={goalTitle}
          amount={amount}
        />

        <div>
          <label className="block text-sm font-medium mb-2">
            Reason for Refund Request *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded-lg p-3 min-h-30"
            placeholder="Please explain why you're requesting a refund..."
          />
          <p className="text-gray-500 text-sm mt-1">
            Refunds are typically approved for technical issues or exceptional
            circumstances.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-red-700">{error}</div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={submit}
            disabled={isSubmitting}
            className="flex-1 bg-black text-white rounded-lg py-3 font-medium disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </button>
          {onSuccess && (
            <button
              onClick={onSuccess}
              disabled={isSubmitting}
              className="px-6 py-3 border rounded-lg font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
