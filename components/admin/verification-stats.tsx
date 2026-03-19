import { cache, Suspense } from "react";
import { Clock, CheckCircle, XCircle } from "lucide-react";

type VerificationCounts = {
  pending: number;
  approved: number;
  rejected: number;
};

const getVerificationCounts = cache(async (): Promise<VerificationCounts> => {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();

  const [{ count: pending }, { count: approved }, { count: rejected }] =
    await Promise.all([
      supabase
        .from("goal_submissions")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "pending"),
      supabase
        .from("goal_submissions")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "approved"),
      supabase
        .from("goal_submissions")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "rejected"),
    ]);

  return {
    pending: pending ?? 0,
    approved: approved ?? 0,
    rejected: rejected ?? 0,
  };
});

export default async function VerificationStats() {
  const { pending, approved, rejected } = await getVerificationCounts();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border rounded-lg p-4 bg-yellow-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
            <div className="text-gray-600">Pending</div>
          </div>
          <Clock className="w-8 h-8 text-yellow-600" />
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-green-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-green-600">{approved}</div>
            <div className="text-gray-600">Approved</div>
          </div>
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-red-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-red-600">{rejected}</div>
            <div className="text-gray-600">Rejected</div>
          </div>
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
      </div>
    </div>
  );
}
