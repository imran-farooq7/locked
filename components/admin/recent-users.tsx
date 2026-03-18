import { fetchAdminDashboardData } from "@/lib/admin-dashboard";
import Link from "next/link";

export default async function RecentUsers() {
  const { recentUsers } = await fetchAdminDashboardData();
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">New Users</h2>
        <Link
          href="/admin/users"
          className="text-sm text-black hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {recentUsers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No new users</p>
        ) : (
          recentUsers.map((user: any) => (
            <div
              key={user.id}
              className="flex items-center space-x-3 border-b pb-3"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium">{user.email}</div>
                <div className="text-sm text-gray-600">
                  Joined {new Date(user.created_at!).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
