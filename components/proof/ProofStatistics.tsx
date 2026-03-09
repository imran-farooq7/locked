import { ProofStatistics as ProofStatisticsType } from "@/app/dashboard/settings/proof/page";
import { StatisticsCard } from "./StatisticsCard";

function ProofStatistics({ stats }: { stats: ProofStatisticsType }) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Proof Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatisticsCard title="Total Proofs" value={stats.total} />
        <StatisticsCard
          title="Approved"
          value={stats.approved}
          color="text-green-600"
        />
        <StatisticsCard
          title="Rejected"
          value={stats.rejected}
          color="text-red-600"
        />
        <StatisticsCard title="Success Rate" value={`${stats.successRate}%`} />
      </div>
    </div>
  );
}
export default ProofStatistics;
