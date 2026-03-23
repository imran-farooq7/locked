// app/dashboard/settings/proof/page.tsx
import ProofSettingsForm from "@/components/proof/proof-settings-form";
import ProofStatistics from "@/components/proof/ProofStatistics";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { QuickActions } from "@/components/dashboard/QuickActions";

type ProofSettings = {
  default_proof_type: "text" | "image" | "file";
  require_proof_for_all: boolean;
  auto_verify_small_goals: boolean;
  small_goal_threshold: number;
  proof_reminder_hours: number;
  allow_file_uploads: boolean;
  max_file_size_mb: number;
  allowed_file_types: string[];
};

export type ProofStatistics = {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  successRate: number;
};

async function getProofStatistics(userId: string): Promise<ProofStatistics> {
  const supabase = await createSupabaseServerClient();

  const { data: submissions } = await supabase
    .from("goal_submissions")
    .select("verification_status")
    .eq("user_id", userId);

  if (!submissions) {
    return { total: 0, approved: 0, rejected: 0, pending: 0, successRate: 0 };
  }

  const total = submissions.length;
  const approved = submissions.filter(
    (s) => s.verification_status === "approved",
  ).length;
  const rejected = submissions.filter(
    (s) => s.verification_status === "rejected",
  ).length;
  const pending = submissions.filter(
    (s) => s.verification_status === "pending",
  ).length;
  const successRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return { total, approved, rejected, pending, successRate };
}

function ProofGuidelines() {
  const guidelines = [
    { text: "Be specific in your descriptions", positive: true },
    { text: "Upload clear, readable images", positive: true },
    { text: "Avoid blurry or unclear photos", positive: false },
    { text: "Don't submit unrelated content", positive: false },
  ];

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Proof Guidelines</h3>
      <ul className="space-y-3 text-sm">
        {guidelines.map((guideline, index) => (
          <li key={index} className="flex items-start">
            <span
              className={`mr-2 ${guideline.positive ? "text-green-600" : "text-red-600"}`}
            >
              {guideline.positive ? "✓" : "✗"}
            </span>
            <span>{guideline.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ProofSettingsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user preferences and statistics in parallel
  const [preferencesResult, stats] = await Promise.all([
    supabase
      .from("user_preferences")
      .select("proof_settings")
      .eq("user_id", user!.id)
      .single(),
    getProofStatistics(user!.id),
  ]);

  const defaultSettings: ProofSettings = {
    default_proof_type: "text",
    require_proof_for_all: false,
    auto_verify_small_goals: true,
    small_goal_threshold: 1000, // $10
    proof_reminder_hours: 24,
    allow_file_uploads: true,
    max_file_size_mb: 10,
    allowed_file_types: ["image/jpeg", "image/png", "application/pdf"],
  };

  const proofSettings =
    (preferencesResult.data?.proof_settings as ProofSettings) ||
    defaultSettings;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Proof Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure how proof submissions work for your goals
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2">
          <div className="border rounded-lg p-6 mb-6">
            <ProofSettingsForm initialPreferences={proofSettings} />
          </div>

          <ProofStatistics stats={stats} />
        </div>

        {/* Help & Guidelines */}
        <div className="space-y-6">
          <ProofGuidelines />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
