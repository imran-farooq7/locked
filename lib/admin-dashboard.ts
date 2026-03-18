import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminDashboardData {
  totalUsers: number;
  activeGoals: number;
  pendingVerifications: number;
  pendingRefunds: number;
  recentPayments: any[];
  recentUsers: any[];
}

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createSupabaseServerClient();

  const [
    { count: totalUsers },
    { count: activeGoals },
    { count: pendingVerifications },
    { count: pendingRefunds },
    { data: recentPayments },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("goals")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("goal_submissions")
      .select("*", { count: "exact", head: true })
      .eq("verification_status", "pending"),
    supabase
      .from("refund_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("penalty_charges")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    totalUsers: totalUsers || 0,
    activeGoals: activeGoals || 0,
    pendingVerifications: pendingVerifications || 0,
    pendingRefunds: pendingRefunds || 0,
    recentPayments: recentPayments || [],
    recentUsers: recentUsers || [],
  };
}
