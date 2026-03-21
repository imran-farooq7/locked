"use client";
import AnalyticsHeader from "./analytics-header";
import GoalCompletionChart from "./goal-completion-chart";
import ProofStatsChart from "./proof-stats-chart";
import RevenueTrendChart from "./revenue-trend-chart";
import TopPenaltyGoalsTable from "./top-penalty-goals-table";
import UserGrowthChart from "./user-growth-chart";
import { AnalyticsData, DateRange } from "./types";

interface AnalyticsDashboardViewProps {
  data: AnalyticsData;
  dateRange: DateRange;
}

export default function AnalyticsDashboardView({
  data,
  dateRange,
}: AnalyticsDashboardViewProps) {
  return (
    <div className="space-y-8">
      <AnalyticsHeader dateRange={dateRange} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueTrendChart data={data.revenueTrend} />
        <GoalCompletionChart data={data.goalCompletion} />
        <ProofStatsChart data={data.proofStats} />
        <UserGrowthChart data={data.userGrowth} />
      </div>

      <TopPenaltyGoalsTable data={data.topPenaltyGoals} />
    </div>
  );
}
