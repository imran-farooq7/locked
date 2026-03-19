// app/admin/users/page.tsx
import UsersManager from "@/components/admin/users-manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();

  // Get user statistics
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: activeToday } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte(
      "last_sign_in_at",
      new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    );

  const { count: admins } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_admin", true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage user accounts, permissions, and activity
          </p>
        </div>

        <button className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800">
          Invite User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold">
            {totalUsers?.toLocaleString()}
          </div>
          <div className="text-gray-600">Total Users</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {activeToday?.toLocaleString()}
          </div>
          <div className="text-gray-600">Active Today</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">
            {admins?.toLocaleString()}
          </div>
          <div className="text-gray-600">Admins</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">87%</div>
          <div className="text-gray-600">Retention Rate</div>
        </div>
      </div>

      {/* Users Table */}
      <UsersManager />
    </div>
  );
}
