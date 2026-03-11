// components/payments/payment-history.tsx
"use client";
import { PaymentRecord, FILTER_OPTIONS } from "./payment-history";

export const FilterTabs = ({
  filter,
  onFilterChange,
  payments,
}: {
  filter: string;
  onFilterChange: (status: string) => void;
  payments: PaymentRecord[];
}) => (
  <div className="flex space-x-4 border-b">
    {FILTER_OPTIONS.map((status) => (
      <button
        key={status}
        onClick={() => onFilterChange(status)}
        className={`px-4 py-2 font-medium capitalize ${
          filter === status
            ? "border-b-2 border-black text-black"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        {status}{" "}
        {status !== "all" && (
          <span className="ml-1 text-sm">
            ({payments.filter((p) => p.status === status).length})
          </span>
        )}
      </button>
    ))}
  </div>
);
