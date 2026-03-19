// app/admin/verifications/page.tsx
import VerificationQueue from "@/components/admin/verification-queue";
import VerificationStats from "@/components/admin/verification-stats";
import VerificationFilters from "@/components/admin/verification-filters";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/payments/LoadingSkeleton";

export default function AdminVerificationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Proof Verification</h1>
        <p className="text-gray-600 mt-2">
          Review and verify user-submitted proof for goals
        </p>
      </div>

      {/* Stats */}
      <Suspense fallback={<LoadingSkeleton items={3} />}>
        <VerificationStats />
      </Suspense>

      {/* Filters */}
      <VerificationFilters />

      {/* Verification Queue */}
      <VerificationQueue />
    </div>
  );
}
