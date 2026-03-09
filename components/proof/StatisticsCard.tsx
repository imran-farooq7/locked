export function StatisticsCard({
  title,
  value,
  color = "text-gray-900",
}: {
  title: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="border rounded p-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-gray-600">{title}</div>
    </div>
  );
}
