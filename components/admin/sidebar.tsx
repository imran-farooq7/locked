// components/admin/sidebar.tsx
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-navigation";
import { SidebarToggle } from "./sidebar-toggle";
import { NavMenu } from "./nav-menu";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-white border-r transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="p-6 border-b">
        <SidebarToggle collapsed={collapsed} onChange={setCollapsed} />
      </div>

      <NavMenu
        items={ADMIN_NAV_ITEMS}
        pathname={pathname}
        collapsed={collapsed}
      />
    </aside>
  );
}
