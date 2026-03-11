// components/payments/payment-methods.tsx
"use client";
export const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="animate-pulse rounded-lg border p-4">
        <div className="h-6 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    ))}
  </div>
);
