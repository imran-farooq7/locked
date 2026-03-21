// app/admin/refunds/page.tsx
import { Suspense } from "react";
import RefundsContent from "./refunds-content";
import { LoadingSkeleton } from "@/components/payments/LoadingSkeleton";

export default function AdminRefundsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Refund Requests</h1>
        <p className="text-gray-600 mt-2">
          Review and process user refund requests
        </p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <RefundsContent />
      </Suspense>
    </div>
  );
}
