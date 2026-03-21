import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  AnalyticsData,
  DateRange,
  GoalCompletionStat,
  ProofStat,
  RevenueTrendPoint,
  TopPenaltyGoal,
  UserGrowthPoint,
} from "../admin/analytics/types";
import AnalyticsDashboardView from "./analytics/analytics-dashboard-view";

const PROOF_STATUS_COLORS: Record<string, string> = {
  pending: "#FFBB28",
  approved: "#00C49F",
  rejected: "#FF8042",
};

const toDateKey = (dateValue?: string | null) =>
  dateValue ? new Date(dateValue).toISOString().split("T")[0] : null;

interface AnalyticsDashboardServerProps {
  searchParams?: Promise<{ range?: string }>;
}
const normalizeRange = (range?: string | null): DateRange => {
  if (range === "7d" || range === "30d" || range === "90d" || range === "1y") {
    return range;
  }
  return "30d";
};

export default async function AnalyticsDashboardServer({
  searchParams,
}: AnalyticsDashboardServerProps) {
  const params = await searchParams;
  const dateRange = normalizeRange(params?.range);

  const supabase = await createSupabaseServerClient();

  const days =
    dateRange === "7d"
      ? 7
      : dateRange === "30d"
        ? 30
        : dateRange === "90d"
          ? 90
          : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [revenueData, goalData, userData, proofData, penaltyGoals] =
    await Promise.all([
      fetchRevenueTrend(supabase, startDate),
      fetchGoalCompletion(supabase, startDate),
      fetchUserGrowth(supabase, startDate),
      fetchProofStats(supabase, startDate),
      fetchTopPenaltyGoals(supabase, startDate),
    ]);

  const data: AnalyticsData = {
    revenueTrend: revenueData,
    goalCompletion: goalData,
    userGrowth: userData,
    proofStats: proofData,
    topPenaltyGoals: penaltyGoals,
  };

  return <AnalyticsDashboardView data={data} dateRange={dateRange} />;
}

const fetchRevenueTrend = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startDate: Date,
): Promise<RevenueTrendPoint[]> => {
  const { data: charges } = await supabase
    .from("penalty_charges")
    .select("amount, status, created_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at");

  const dailyMap = new Map<
    string,
    { revenue: number; penalties: number; refunds: number }
  >();

  charges?.forEach((charge) => {
    const date = toDateKey(charge.created_at);
    if (!date) return;
    const existing = dailyMap.get(date) || {
      revenue: 0,
      penalties: 0,
      refunds: 0,
    };

    if (charge.status === "charged") {
      existing.revenue += charge.amount / 100;
      existing.penalties += 1;
    } else if (charge.status === "refunded") {
      existing.refunds += charge.amount / 100;
    }

    dailyMap.set(date, existing);
  });

  return Array.from(dailyMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const fetchGoalCompletion = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startDate: Date,
): Promise<GoalCompletionStat[]> => {
  const { data: goals } = await supabase
    .from("goals")
    .select("status, created_at")
    .gte("created_at", startDate.toISOString());

  const statusCounts = (goals || []).reduce(
    (acc, goal) => {
      const status = goal.status ?? "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    percentage: Math.round((count / total) * 100),
  }));
};

const fetchUserGrowth = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startDate: Date,
): Promise<UserGrowthPoint[]> => {
  const [newUsersResult, activeUsersResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", startDate.toISOString()),
    supabase
      .from("profiles")
      .select("last_sign_in_at")
      .gte("last_sign_in_at", startDate.toISOString()),
  ]);

  const newUsersMap = new Map<string, number>();
  newUsersResult.data?.forEach((user) => {
    const date = toDateKey(user.created_at);
    if (!date) return;
    newUsersMap.set(date, (newUsersMap.get(date) || 0) + 1);
  });

  const activeUsersMap = new Map<string, number>();
  activeUsersResult.data?.forEach((user) => {
    const date = toDateKey(user.last_sign_in_at);
    if (!date) return;
    activeUsersMap.set(date, (activeUsersMap.get(date) || 0) + 1);
  });

  const dates = new Set([...newUsersMap.keys(), ...activeUsersMap.keys()]);

  return Array.from(dates)
    .sort()
    .map((date) => ({
      date,
      newUsers: newUsersMap.get(date) || 0,
      activeUsers: activeUsersMap.get(date) || 0,
    }));
};

const fetchProofStats = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startDate: Date,
): Promise<ProofStat[]> => {
  const { data: submissions } = await supabase
    .from("goal_submissions")
    .select("verification_status, created_at")
    .gte("created_at", startDate.toISOString());

  const statusCounts = (submissions || []).reduce(
    (acc, submission) => {
      const status = (
        submission.verification_status ?? "pending"
      ).toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    color: PROOF_STATUS_COLORS[status] ?? "#8884D8",
  }));
};

const fetchTopPenaltyGoals = async (
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  startDate: Date,
): Promise<TopPenaltyGoal[]> => {
  const { data: charges } = await supabase
    .from("penalty_charges")
    .select(
      `
      amount,
      goal_id,
      created_at,
      goal:goals!penalty_charges_goal_id_fkey(title, penalty_amount),
      user:profiles!penalty_charges_user_id_fkey(email)
    `,
    )
    .eq("status", "charged")
    .gte("created_at", startDate.toISOString());

  const goalsMap = new Map<
    string,
    {
      title: string;
      penalty_amount: number;
      failure_count: number;
      user_email: string;
      total_amount: number;
    }
  >();

  charges?.forEach((charge) => {
    const goalId = charge.goal_id;
    const existing = goalsMap.get(goalId) || {
      title: charge.goal?.title || "Untitled goal",
      penalty_amount: charge.goal?.penalty_amount || charge.amount,
      failure_count: 0,
      user_email: charge.user?.email || "Unknown user",
      total_amount: 0,
    };

    existing.failure_count += 1;
    existing.total_amount += charge.amount;
    goalsMap.set(goalId, existing);
  });

  return Array.from(goalsMap.values())
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, 5)
    .map(({ total_amount, ...rest }) => rest);
};
