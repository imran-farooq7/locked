// components/admin/nav-menu.tsx
import { memo } from "react";
import { AdminNavItem } from "@/lib/admin-navigation";
import { NavLink } from "./nav-link";
import { SystemStatus } from "./system-status";

interface NavMenuProps {
  items: AdminNavItem[];
  pathname: string;
  collapsed: boolean;
}

export const NavMenu = memo(function NavMenu({
  items,
  pathname,
  collapsed,
}: NavMenuProps) {
  return (
    <nav className="p-4">
      <ul className="space-y-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <NavLink item={item} isActive={isActive} collapsed={collapsed} />
            </li>
          );
        })}
      </ul>

      <SystemStatus collapsed={collapsed} />
    </nav>
  );
});
