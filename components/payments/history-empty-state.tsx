import { AlertCircle } from "lucide-react";

const EmptyState = ({ filter }: { filter: string }) => (
  <div className="rounded-lg border border-dashed p-8 text-center">
    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-600">No payment history found</p>
    <p className="text-sm text-gray-500 mt-2">
      {filter !== "all"
        ? "Try changing the filter"
        : "Penalties will appear here when charged"}
    </p>
  </div>
);
export default EmptyState;
