// components/payments/payment-history.tsx
"use client";
import { useMemo } from "react";
import { PaymentRecord } from "./payment-history";

export const SummaryStats = ({ payments }: { payments: PaymentRecord[] }) => {
  const stats = useMemo(() => {
    const totalCharged = payments
      .filter((p) => p.status === "charged")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalRefunded = payments
      .filter((p) => p.status === "refunded")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPayments: payments.length,
      totalCharged,
      totalRefunded,
      netTotal: totalCharged - totalRefunded,
    };
  }, [payments]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="border rounded-lg p-4">
        <div className="text-2xl font-bold">{stats.totalPayments}</div>
        <div className="text-gray-600">Total Payments</div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="text-2xl font-bold text-green-600">
          ${(stats.totalCharged / 100).toFixed(2)}
        </div>
        <div className="text-gray-600">Total Charged</div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="text-2xl font-bold text-blue-600">
          ${(stats.totalRefunded / 100).toFixed(2)}
        </div>
        <div className="text-gray-600">Total Refunded</div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="text-2xl font-bold">
          ${(stats.netTotal / 100).toFixed(2)}
        </div>
        <div className="text-gray-600">Net Total</div>
      </div>
    </div>
  );
};
