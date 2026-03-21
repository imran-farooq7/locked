import Link from "next/link";
import { DateRange } from "./types";

interface AnalyticsHeaderProps {
  dateRange: DateRange;
}

const ranges: DateRange[] = ["7d", "30d", "90d", "1y"];

export default function AnalyticsHeader({ dateRange }: AnalyticsHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <p className="text-gray-600">Comprehensive insights and metrics</p>
      </div>

      <div className="flex space-x-2">
        {ranges.map((range) => (
          <Link
            key={range}
            href={`/admin/analytics?range=${range}`}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              dateRange === range
                ? "bg-black text-white"
                : "border text-gray-700 hover:bg-gray-50"
            }`}
          >
            {range}
          </Link>
        ))}
      </div>
    </div>
  );
}
