import { fetchAdminDashboardData } from "@/lib/admin-dashboard";
import Link from "next/link";

export default async function RecentPayments() {
  const { recentPayments } = await fetchAdminDashboardData();
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Payments</h2>
        <Link
          href="/admin/payments"
          className="text-sm text-black hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {recentPayments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent payments</p>
        ) : (
          recentPayments.map((payment: any) => (
            <div
              key={payment.id}
              className="flex justify-between items-center border-b pb-3"
            >
              <div>
                <div className="font-medium">
                  ${(payment.amount / 100).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(payment.created_at!).toLocaleDateString()}
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  payment.status === "charged"
                    ? "bg-green-100 text-green-800"
                    : payment.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {payment.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
