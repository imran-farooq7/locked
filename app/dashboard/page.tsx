import { createSupabaseServerClient } from "@/lib/supabase/server";
import GoalsList from "@/components/goals/goals-list";
import CreateGoalButton from "@/components/goals/create-goal-button";
import { calculateTimeRemaining, isGoalExpired } from "@/lib/goal-utils";
import { redirect } from "next/navigation";

const MAX_UPCOMING_DEADLINES = 5;
const URGENT_TIME_LABEL = "hours";

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

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.id);

  const safeGoals = goals ?? [];
  const stats: DashboardStats = { ...INITIAL_STATS };
  const activeDeadlines: Array<
    (typeof safeGoals)[number] & {
      timeRemaining: string;
      isUrgent: boolean;
      dueDateLabel: string;
      targetTimestamp: number;
    }
  > = [];

  for (const goal of safeGoals) {
    stats.total += 1;

    if (goal.status === "active") {
      stats.active += 1;
      stats.totalPenaltyRisk += goal.penalty_amount;

      const targetDate = new Date(goal.target_date);
      const timeRemaining = calculateTimeRemaining(targetDate);

      activeDeadlines.push({
        ...goal,
        timeRemaining,
        isUrgent:
          isGoalExpired(targetDate) ||
          timeRemaining.includes(URGENT_TIME_LABEL),
        dueDateLabel: targetDate.toLocaleDateString(),
        targetTimestamp: targetDate.getTime(),
      });
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

  const upcomingDeadlines = activeDeadlines
    .toSorted((a, b) => a.targetTimestamp - b.targetTimestamp)
    .slice(0, MAX_UPCOMING_DEADLINES);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Goals</h1>
          <p className="text-gray-600">Track, commit, and stay accountable</p>
        </div>
        <CreateGoalButton />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-6">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-gray-600">Total Goals</div>
        </div>
        <div className="rounded-lg border p-6">
          <div className="text-2xl font-bold text-green-600">
            {stats.active}
          </div>
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

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Deadlines</h2>
          <div className="space-y-3">
            {upcomingDeadlines.map((goal) => (
              <div
                key={goal.id}
                className={`flex justify-between items-center p-3 rounded ${
                  goal.isUrgent ? "bg-red-50" : "bg-gray-50"
                }`}
              >
                <div>
                  <h3 className="font-medium">{goal.title}</h3>
                  <p className="text-sm text-gray-600">
                    Due: {goal.dueDateLabel}
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`font-medium ${
                      goal.isUrgent ? "text-red-600" : "text-gray-700"
                    }`}
                  >
                    {goal.timeRemaining}
                  </div>
                  <div className="text-sm text-gray-600">
                    Penalty: ${(goal.penalty_amount / 100).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="rounded-lg border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">All Goals</h2>
          <div className="text-sm text-gray-600">
            Showing {safeGoals.length} goals
          </div>
        </div>
        <GoalsList />
      </div>
    </div>
  );
}
