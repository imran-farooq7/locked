// components/payments/refund-requests.tsx
"use client";
export const RequestDetails = ({
  chargeId,
  goalTitle,
  amount,
}: {
  chargeId: string;
  goalTitle: string;
  amount: number;
}) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <span className="text-gray-600">Goal:</span> {goalTitle}
      </div>
      <div>
        <span className="text-gray-600">Amount:</span>{" "}
        <span className="font-medium">${(amount / 100).toFixed(2)}</span>
      </div>
      <div>
        <span className="text-gray-600">Charge ID:</span>{" "}
        <code className="text-xs">{chargeId.substring(0, 12)}...</code>
      </div>
    </div>
  </div>
);
