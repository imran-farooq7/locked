import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cache } from "react";

const getUserGoals = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId);
  return goals ?? [];
});

type DashboardStats = {
  total: number;
  active: number;
  completed: number;
  failed: number;
  totalPenaltyRisk: number;
};

const INITIAL_STATS: DashboardStats = {
  total: 0,
  active: 0,
  completed: 0,
  failed: 0,
  totalPenaltyRisk: 0,
};

type Goal = {
  id: string;
  status: string | null;
  penalty_amount: number;
};
const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
export default async function StatsOverview() {
  const user = await getCurrentUser();
  const goals = await getUserGoals(user!.id);

  const safeGoals = goals ?? [];
  const stats: DashboardStats = { ...INITIAL_STATS };

  for (const goal of safeGoals) {
    stats.total += 1;

    if (goal.status === "active") {
      stats.active += 1;
      stats.totalPenaltyRisk += goal.penalty_amount;
      continue;
    }

    if (goal.status === "completed") {
      stats.completed += 1;
      continue;
    }

    if (goal.status === "failed") {
      stats.failed += 1;
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="rounded-lg border p-6">
        <div className="text-2xl font-bold">{stats.total}</div>
        <div className="text-gray-600">Total Goals</div>
      </div>
      <div className="rounded-lg border p-6">
        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        <div className="text-gray-600">Active</div>
      </div>
      <div className="rounded-lg border p-6">
        <div className="text-2xl font-bold text-blue-600">
          {stats.completed}
        </div>
        <div className="text-gray-600">Completed</div>
      </div>
      <div className="rounded-lg border p-6">
        <div className="text-2xl font-bold text-red-600">
          ${(stats.totalPenaltyRisk / 100).toFixed(2)}
        </div>
        <div className="text-gray-600">At Risk</div>
      </div>
    </div>
  );
}
