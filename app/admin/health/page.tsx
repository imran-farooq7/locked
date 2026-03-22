// app/admin/health/page.tsx

import SystemHealthDashboard from "@/components/admin/system-health";

export default function AdminHealthPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">System Health</h1>
        <p className="text-gray-600 mt-2">
          Monitor system performance, uptime, and health metrics
        </p>
      </div>

      {/* System Health Dashboard */}
      <SystemHealthDashboard />
    </div>
  );
}
