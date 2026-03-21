export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse h-80 bg-gray-200 rounded-lg"
          ></div>
        ))}
      </div>
    </div>
  );
}
