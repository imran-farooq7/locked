// components/admin/system-status.tsx
import { memo } from "react";

interface SystemStatusProps {
  collapsed: boolean;
}

export const SystemStatus = memo(function SystemStatus({
  collapsed,
}: SystemStatusProps) {
  if (collapsed) return null;

  return (
    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="text-sm font-medium text-blue-900">System Status</div>
      <div className="flex items-center mt-2">
        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
        <span className="text-sm text-blue-700">All systems operational</span>
      </div>
    </div>
  );
});
