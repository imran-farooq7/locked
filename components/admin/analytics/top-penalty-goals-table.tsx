import { TopPenaltyGoal } from "./types";

interface TopPenaltyGoalsTableProps {
  data: TopPenaltyGoal[];
}

export default function TopPenaltyGoalsTable({
  data,
}: TopPenaltyGoalsTableProps) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Top Penalty-Generating Goals</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Goal Title</th>
              <th className="text-left py-3">User</th>
              <th className="text-left py-3">Penalty Amount</th>
              <th className="text-left py-3">Failure Count</th>
              <th className="text-left py-3">Total Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.length === 0 ? (
              <tr>
                <td className="py-6 text-center text-gray-600" colSpan={5}>
                  No penalty data for this period.
                </td>
              </tr>
            ) : (
              data.map((goal, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3">{goal.title}</td>
                  <td className="py-3">{goal.user_email}</td>
                  <td className="py-3">
                    ${(goal.penalty_amount / 100).toFixed(2)}
                  </td>
                  <td className="py-3">{goal.failure_count}</td>
                  <td className="py-3 font-medium">
                    $
                    {((goal.penalty_amount * goal.failure_count) / 100).toFixed(
                      2,
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
