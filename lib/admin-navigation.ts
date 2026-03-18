// lib/admin-navigation.ts
import {
  LayoutDashboard,
  Users,
  Target,
  CreditCard,
  FileText,
  Settings,
  BarChart3,
  Bell,
  Database,
  Activity,
  Shield,
  LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge: string | null;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
    badge: null,
  },
  {
    title: "Goals",
    href: "/admin/goals",
    icon: Target,
    badge: null,
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
    badge: null,
  },
  {
    title: "Proofs",
    href: "/admin/proofs",
    icon: FileText,
    badge: null,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    badge: null,
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    badge: null,
  },
  {
    title: "Jobs",
    href: "/admin/jobs",
    icon: Activity,
    badge: null,
  },
  {
    title: "Database",
    href: "/admin/database",
    icon: Database,
    badge: null,
  },
  {
    title: "Security",
    href: "/admin/security",
    icon: Shield,
    badge: null,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    badge: null,
  },
];
