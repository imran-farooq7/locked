// components/admin/nav-link.tsx
import { memo } from "react";
import Link from "next/link";
import { AdminNavItem } from "@/lib/admin-navigation";

interface NavLinkProps {
  item: AdminNavItem;
  isActive: boolean;
  collapsed: boolean;
}

export const NavLink = memo(function NavLink({
  item,
  isActive,
  collapsed,
}: NavLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
        isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
      title={collapsed ? item.title : undefined}
    >
      <Icon className={`shrink-0 ${collapsed ? "mx-auto" : "mr-3"}`} />

      {!collapsed && (
        <>
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
});
