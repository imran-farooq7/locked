import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { UserGrowthPoint } from "./types";

interface UserGrowthChartProps {
  data: UserGrowthPoint[];
}

export default function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-4">User Growth</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="newUsers"
              stroke="#8884d8"
              name="New Users"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="activeUsers"
              stroke="#82ca9d"
              name="Active Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
