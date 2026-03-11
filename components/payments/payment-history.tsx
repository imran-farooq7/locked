// components/payments/payment-history.tsx
"use client";

import usePaymentHistory from "@/hooks/use-payment-history";
import { useEffect, useState } from "react";
import { FilterTabs } from "./FilterTabs";
import EmptyState from "./history-empty-state";
import { LoadingSkeleton } from "./LoadingSkeleton";
import PaymentCard from "./payment-card";
import { SummaryStats } from "./SummaryStats";

interface PaymentHistoryProps {
  limit?: number;
}

export interface PaymentRecord {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  status: "charged" | "refunded" | "failed" | "pending" | "all";
  reason: string;
  stripe_charge_id?: string;
  stripe_invoice_id?: string;
  goal: {
    title: string;
    id: string;
  };
}

export const FILTER_OPTIONS = ["all", "charged", "refunded", "failed"] as const;

export default function PaymentHistory({ limit = 10 }: PaymentHistoryProps) {
  const [filter, setFilter] = useState<
    "all" | "charged" | "refunded" | "failed"
  >("all");
  const { payments, isPending, loadPayments, downloadReceipt } =
    usePaymentHistory(limit);

  useEffect(() => {
    loadPayments(filter);
  }, [filter, loadPayments]);

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter as typeof filter);
  };

  if (isPending) {
    return <LoadingSkeleton items={3} />;
  }

  if (payments.length === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <div className="space-y-6">
      <SummaryStats payments={payments} />
      <FilterTabs
        filter={filter}
        onFilterChange={handleFilterChange}
        payments={payments}
      />
      <div className="space-y-4">
        {payments.map((payment) => (
          <PaymentCard
            key={payment.id}
            payment={payment}
            onDownloadReceipt={downloadReceipt}
          />
        ))}
      </div>
    </div>
  );
}
