import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
const GoalDetailsLink = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let latestGoalId: string | null = null;

  if (user) {
    const { data } = await supabase
      .from("goals")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    latestGoalId = data?.id ?? null;
  }
  if (latestGoalId) {
    return (
      <Link
        href={`/dashboard/goals/${latestGoalId}`}
        className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
      >
        Latest Goal
      </Link>
    );
  }

  return (
    <span className="rounded-full border px-4 py-2 text-sm text-gray-500">
      Latest Goal (create one first)
    </span>
  );
};

export default GoalDetailsLink;
