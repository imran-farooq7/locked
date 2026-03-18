import { AlertCircle, CreditCard, Activity, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/verifications"
          className="p-4 border rounded-lg text-center hover:bg-gray-50"
        >
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
          <span className="text-sm font-medium">Verify Proofs</span>
        </Link>

        <Link
          href="/admin/refunds"
          className="p-4 border rounded-lg text-center hover:bg-gray-50"
        >
          <CreditCard className="w-6 h-6 mx-auto mb-2 text-purple-600" />
          <span className="text-sm font-medium">Review Refunds</span>
        </Link>

        <Link
          href="/admin/jobs"
          className="p-4 border rounded-lg text-center hover:bg-gray-50"
        >
          <Activity className="w-6 h-6 mx-auto mb-2 text-blue-600" />
          <span className="text-sm font-medium">Check Jobs</span>
        </Link>

        <Link
          href="/admin/analytics"
          className="p-4 border rounded-lg text-center hover:bg-gray-50"
        >
          <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
          <span className="text-sm font-medium">View Analytics</span>
        </Link>
      </div>
    </div>
  );
}
