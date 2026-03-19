import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cache } from "react";
import { calculateTimeRemaining, isGoalExpired } from "@/lib/goal-utils";

const getActiveGoals = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");
  return goals ?? [];
});

const MAX_UPCOMING_DEADLINES = 5;
const URGENT_TIME_LABEL = "hours";

type GoalWithDeadline = {
  id: string;
  title: string;
  target_date: string;
  penalty_amount: number;
  timeRemaining: string;
  isUrgent: boolean;
  dueDateLabel: string;
  targetTimestamp: number;
};
const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
export default async function UpcomingDeadlines() {
  const user = await getCurrentUser();
  const goals = await getActiveGoals(user!.id);

  const safeGoals = goals ?? [];
  const activeDeadlines: GoalWithDeadline[] = [];

  for (const goal of safeGoals) {
    const targetDate = new Date(goal.target_date);
    const timeRemaining = calculateTimeRemaining(targetDate);

    activeDeadlines.push({
      id: goal.id,
      title: goal.title,
      target_date: goal.target_date,
      penalty_amount: goal.penalty_amount,
      timeRemaining,
      isUrgent:
        isGoalExpired(targetDate) || timeRemaining.includes(URGENT_TIME_LABEL),
      dueDateLabel: targetDate.toLocaleDateString(),
      targetTimestamp: targetDate.getTime(),
    });
  }

  const upcomingDeadlines = activeDeadlines
    .toSorted((a, b) => a.targetTimestamp - b.targetTimestamp)
    .slice(0, MAX_UPCOMING_DEADLINES);

  if (upcomingDeadlines.length === 0) return null;

  return (
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
              <p className="text-sm text-gray-600">Due: {goal.dueDateLabel}</p>
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
  );
}
