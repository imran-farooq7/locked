import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { GoalCompletionStat } from "./types";

interface GoalCompletionChartProps {
  data: GoalCompletionStat[];
}

export default function GoalCompletionChart({
  data,
}: GoalCompletionChartProps) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Goal Completion Status</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Goal Count" />
            <Bar dataKey="percentage" fill="#82ca9d" name="Percentage (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
