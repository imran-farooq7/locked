import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cache } from "react";
import CreateGoalButton from "@/components/goals/create-goal-button";
import LogoutButton from "@/components/auth/logout-button";
import Link from "next/link";

const getUserProfile = cache(async (userId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();
  return profile;
});
const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export default async function DashboardHeader() {
  const user = await getCurrentUser();
  const profile = await getUserProfile(user!.id);

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Your Goals</h1>
        <p className="text-gray-600">Track, commit, and stay accountable</p>
      </div>
      <div className="flex items-center gap-2">
        {profile?.is_admin && (
          <Link
            href="/admin"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Admin Panel
          </Link>
        )}
        <CreateGoalButton />
        <LogoutButton />
      </div>
    </div>
  );
}
