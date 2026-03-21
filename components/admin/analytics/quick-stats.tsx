import { createSupabaseServerClient } from "@/lib/supabase/server";

async function QuickStats() {
  const supabase = await createSupabaseServerClient();
  const now = new Date();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    { count: usersThisMonth },
    { count: goalsThisMonth },
    { count: revenueThisMonth },
    { data: topGoals },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("goals")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("penalty_charges")
      .select("*", { count: "exact", head: true })
      .eq("status", "charged")
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("goals")
      .select("title, penalty_amount, goal_submissions(count)")
      .eq("status", "failed")
      .order("penalty_amount", { ascending: false })
      .limit(5),
  ]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="border rounded-lg p-6">
        <div className="text-3xl font-bold text-blue-600">
          {usersThisMonth || 0}
        </div>
        <div className="text-gray-600">New Users (This Month)</div>
      </div>
      <div className="border rounded-lg p-6">
        <div className="text-3xl font-bold text-green-600">
          {goalsThisMonth || 0}
        </div>
        <div className="text-gray-600">Goals Created</div>
      </div>
      <div className="border rounded-lg p-6">
        <div className="text-3xl font-bold text-purple-600">
          ${(revenueThisMonth || 0) / 100}
        </div>
        <div className="text-gray-600">Revenue This Month</div>
      </div>
      <div className="border rounded-lg p-6">
        <div className="text-3xl font-bold text-orange-600">94%</div>
        <div className="text-gray-600">Success Rate</div>
      </div>
    </div>
  );
}
export default QuickStats;
