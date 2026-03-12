import { createSupabaseServerClient } from "@/lib/supabase/server";
import { StatCard } from "./StatCard";

const Stats = async () => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get payment statistics
  const { data: stats } = await supabase
    .from("penalty_charges")
    .select("status, amount")
    .eq("user_id", user.id);

  const calculateStats = () => {
    const totalCharged =
      stats
        ?.filter((s) => s.status === "charged")
        .reduce((sum, s) => sum + s.amount, 0) || 0;

    const totalRefunded =
      stats
        ?.filter((s) => s.status === "refunded")
        .reduce((sum, s) => sum + s.amount, 0) || 0;

    const chargedCount =
      stats?.filter((s) => s.status === "charged").length || 0;

    return {
      totalPaid: (totalCharged - totalRefunded) / 100,
      totalCharged: totalCharged / 100,
      totalRefunded: totalRefunded / 100,
      chargedCount,
    };
  };

  const { totalPaid, totalCharged, totalRefunded, chargedCount } =
    calculateStats();
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <StatCard value={`$${totalPaid.toFixed(2)}`} label="Total Paid" />
      <StatCard
        value={`$${totalCharged.toFixed(2)}`}
        label="Total Charged"
        color="text-green-600"
      />
      <StatCard
        value={`$${totalRefunded.toFixed(2)}`}
        label="Total Refunded"
        color="text-blue-600"
      />
      <StatCard value={chargedCount} label="Total Charges" />
    </div>
  );
};

export default Stats;
