import { fetchAdminDashboardData } from "@/lib/admin-dashboard";
import { Users, Target, Clock, CreditCard, LucideIcon } from "lucide-react";
import Link from "next/link";

interface StatItem {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  link: string;
}

export default async function StatsGrid() {
  const { totalUsers, activeGoals, pendingVerifications, pendingRefunds } =
    await fetchAdminDashboardData();
  const stats: StatItem[] = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "bg-blue-500",
      link: "/admin/users",
    },
    {
      title: "Active Goals",
      value: activeGoals,
      icon: Target,
      color: "bg-green-500",
      link: "/admin/goals",
    },
    {
      title: "Pending Verifications",
      value: pendingVerifications,
      icon: Clock,
      color: "bg-yellow-500",
      link: "/admin/verifications",
    },
    {
      title: "Pending Refunds",
      value: pendingRefunds,
      icon: CreditCard,
      color: "bg-purple-500",
      link: "/admin/refunds",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Link
            key={index}
            href={stat.link}
            className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                <Icon
                  className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`}
                />
              </div>
              <span className="text-3xl font-bold">
                {stat.value.toLocaleString()}
              </span>
            </div>
            <h3 className="text-gray-600 font-medium">{stat.title}</h3>
          </Link>
        );
      })}
    </div>
  );
}
