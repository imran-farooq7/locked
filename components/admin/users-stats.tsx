// components/admin/users-stats.tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function UsersStats() {
  const supabase = await createSupabaseServerClient();

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
  );
}
