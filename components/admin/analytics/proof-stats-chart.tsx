import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ProofStat } from "./types";

interface ProofStatsChartProps {
  data: ProofStat[];
}

export default function ProofStatsChart({ data }: ProofStatsChartProps) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Proof Verification Status</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              dataKey="count"
              nameKey="status"
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
