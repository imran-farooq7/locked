// components/admin/sidebar-toggle.tsx
import { memo } from "react";

interface SidebarToggleProps {
  collapsed: boolean;
  onChange: (collapsed: boolean) => void;
}

export const SidebarToggle = memo(function SidebarToggle({
  collapsed,
  onChange,
}: SidebarToggleProps) {
  return (
    <button
      onClick={() => onChange(!collapsed)}
      className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <div className="w-6 h-6">
        <div
          className={`h-0.5 bg-gray-600 mb-1.5 transition-all ${
            collapsed ? "w-4" : "w-6"
          }`}
        />
        <div
          className={`h-0.5 bg-gray-600 mb-1.5 transition-all ${
            collapsed ? "w-3" : "w-6"
          }`}
        />
        <div
          className={`h-0.5 bg-gray-600 transition-all ${
            collapsed ? "w-2" : "w-6"
          }`}
        />
      </div>
    </button>
  );
});
