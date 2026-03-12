import { createSupabaseServerClient } from "@/lib/supabase/server";

export const StatCard = async ({
  value,
  label,
  color = "text-gray-900",
}: {
  value: string | number;
  label: string;
  color?: string;
}) => {
  return (
    <div className="rounded-lg border p-4">
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
};
