import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function RefundsContent() {
  const supabase = await createSupabaseServerClient();

  // Get refund requests
  const { data: refunds } = await supabase
    .from("refund_requests")
    .select(
      `
      *,
      profiles!inner(email, full_name)
    `,
    )
    .order("created_at", { ascending: false });

  const stats = {
    pending: refunds?.filter((r) => r.status === "pending").length || 0,
    approved: refunds?.filter((r) => r.status === "approved").length || 0,
    rejected: refunds?.filter((r) => r.status === "rejected").length || 0,
    total: refunds?.length || 0,
  };

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-gray-600">Total Requests</div>
        </div>
        <div className="border rounded-lg p-4 bg-yellow-50">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pending}
          </div>
          <div className="text-gray-600">Pending</div>
        </div>
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="text-2xl font-bold text-green-600">
            {stats.approved}
          </div>
          <div className="text-gray-600">Approved</div>
        </div>
        <div className="border rounded-lg p-4 bg-red-50">
          <div className="text-2xl font-bold text-red-600">
            {stats.rejected}
          </div>
          <div className="text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                User
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Goal
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {refunds?.map((refund) => {
              const metadata = refund.metadata as { goal_title?: string } | null;
              const goalTitle = metadata?.goal_title ?? "Unknown goal";
              return (
                <tr key={refund.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">
                      {refund.profiles.full_name || refund.profiles.email}
                    </div>
                    <div className="text-sm text-gray-600">
                      {refund.profiles.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">{goalTitle}</td>
                  <td className="px-6 py-4 font-medium">
                    ${(refund.amount / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">
                    {refund.reason}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        refund.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : refund.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {refund.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(refund.created_at!).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/refunds/${refund.id}`}
                      className="text-black hover:underline"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
