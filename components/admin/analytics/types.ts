export type DateRange = "7d" | "30d" | "90d" | "1y";

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  penalties: number;
  refunds: number;
}

export interface GoalCompletionStat {
  status: string;
  count: number;
  percentage: number;
}

export interface UserGrowthPoint {
  date: string;
  newUsers: number;
  activeUsers: number;
}

export interface ProofStat {
  status: string;
  count: number;
  color: string;
}

export interface TopPenaltyGoal {
  title: string;
  penalty_amount: number;
  failure_count: number;
  user_email: string;
}

export interface AnalyticsData {
  revenueTrend: RevenueTrendPoint[];
  goalCompletion: GoalCompletionStat[];
  userGrowth: UserGrowthPoint[];
  proofStats: ProofStat[];
  topPenaltyGoals: TopPenaltyGoal[];
}
