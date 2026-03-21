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
import { RevenueTrendPoint } from "./types";

interface RevenueTrendChartProps {
  data: RevenueTrendPoint[];
}

export default function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Revenue Trend</h3>
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
              dataKey="revenue"
              stroke="#8884d8"
              name="Revenue ($)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="penalties"
              stroke="#82ca9d"
              name="Penalties"
            />
            <Line
              type="monotone"
              dataKey="refunds"
              stroke="#ff7a7a"
              name="Refunds ($)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
