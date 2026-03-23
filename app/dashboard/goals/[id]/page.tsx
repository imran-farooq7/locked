// app/dashboard/goals/[id]/page.tsx
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateTimeRemaining, isGoalExpired } from "@/lib/goal-utils";
import GoalActions from "@/components/goals/goal-actions";
import SimplifiedGoalActions from "@/components/goals/goal-actions";
import { Suspense } from "react";

interface GoalDetailPageProps {
  params: Promise<{ id: string }>;
}

function getGoalStatusClassName(status: string | null) {
  if (status === "active") return "bg-green-100 text-green-800";
  if (status === "completed") return "bg-blue-100 text-blue-800";
  return "bg-red-100 text-red-800";
}

function getSubmissionStatusClassName(status: string | null) {
  if (status === "approved") return "bg-green-100 text-green-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-yellow-100 text-yellow-800";
}

function getChargeStatusClassName(status: string | null) {
  if (status === "charged") return "text-green-600";
  if (status === "pending") return "text-yellow-600";
  return "text-gray-600";
}

export default function GoalDetailPage({ params }: GoalDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="mb-8">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="mt-3 h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-20 border rounded-lg bg-gray-50 animate-pulse" />
            <div className="h-20 border rounded-lg bg-gray-50 animate-pulse" />
            <div className="h-20 border rounded-lg bg-gray-50 animate-pulse" />
            <div className="h-20 border rounded-lg bg-gray-50 animate-pulse" />
          </div>
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-40 border rounded-lg bg-gray-50 animate-pulse" />
              <div className="h-40 border rounded-lg bg-gray-50 animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="h-40 border rounded-lg bg-gray-50 animate-pulse" />
              <div className="h-40 border rounded-lg bg-gray-50 animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <GoalDetailContent params={params} />
    </Suspense>
  );
}

async function GoalDetailContent({ params }: GoalDetailPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const goalPromise = supabase
    .from("goals")
    .select(
      `
      *,
      goal_submissions(*),
      penalty_charges(*)
    `,
    )
    .eq("id", id)
    .single();
  const userPromise = supabase.auth.getUser();

  const [{ data: goal }, { data: authData }] = await Promise.all([
    goalPromise,
    userPromise,
  ]);
  const user = authData.user;

  if (!goal) notFound();
  if (!user || goal.user_id !== user.id) {
    notFound();
  }

  const deadline = new Date(goal.target_date);
  const timeRemaining = calculateTimeRemaining(deadline);
  const isExpired = isGoalExpired(deadline);
  const formattedDeadline = format(deadline, "PPP p");
  const formattedPenaltyAmount = (goal.penalty_amount / 100).toFixed(2);
  const statusClassName = getGoalStatusClassName(goal.status);
  const statusLabel = goal.status?.toUpperCase() ?? "UNKNOWN";
  const goalCreatedLabel = goal.created_at
    ? format(new Date(goal.created_at), "PPP")
    : "Unknown";

  const submissions =
    goal.goal_submissions?.map((submission) => ({
      ...submission,
      createdAtLabel: submission.created_at
        ? format(new Date(submission.created_at), "PPP")
        : "Unknown",
      verifiedAtLabel: submission.verified_at
        ? format(new Date(submission.verified_at), "PPP")
        : null,
      statusClassName: getSubmissionStatusClassName(
        submission.verification_status,
      ),
    })) ?? [];

  const charges =
    goal.penalty_charges?.map((charge) => ({
      ...charge,
      createdAtLabel: charge.created_at
        ? format(new Date(charge.created_at), "PPP")
        : "Unknown",
      formattedAmount: (charge.amount / 100).toFixed(2),
      statusClassName: getChargeStatusClassName(charge.status),
    })) ?? [];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{goal.title}</h1>
            {goal.description && (
              <p className="text-gray-600 mt-2">{goal.description}</p>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${statusClassName}`}
            >
              {statusLabel}
            </span>
            <SimplifiedGoalActions goal={goal} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-600">Deadline</div>
            <div className="font-medium">{formattedDeadline}</div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-600">Time Remaining</div>
            <div
              className={`font-medium ${
                isExpired ? "text-red-600" : "text-green-600"
              }`}
            >
              {timeRemaining}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-600">Penalty</div>
            <div className="font-medium text-red-600">
              ${formattedPenaltyAmount}
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="text-sm text-gray-600">Proof Required</div>
            <div className="font-medium">
              {goal.proof_required ? "Yes" : "No"}
              {goal.proof_type && ` (${goal.proof_type})`}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {submissions.length > 0 && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Proof Submissions</h2>
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">
                          Submitted on {submission.createdAtLabel}
                        </div>
                        <div
                          className={`text-sm px-2 py-1 rounded inline-block mt-1 ${submission.statusClassName}`}
                        >
                          {submission.verification_status}
                        </div>
                      </div>
                      {submission.verifiedAtLabel && (
                        <div className="text-sm text-gray-600">
                          Verified on {submission.verifiedAtLabel}
                        </div>
                      )}
                    </div>

                    {submission.submission_text && (
                      <p className="mt-3 text-gray-700">
                        {submission.submission_text}
                      </p>
                    )}

                    {submission.file_url && (
                      <div className="mt-3">
                        <a
                          href={submission.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View attached file -&gt;
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {charges.length > 0 && (
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Penalty History</h2>
              <div className="space-y-3">
                {charges.map((charge) => (
                  <div
                    key={charge.id}
                    className="flex justify-between items-center border-b pb-3"
                  >
                    <div>
                      <div className="font-medium">{charge.createdAtLabel}</div>
                      <div className="text-sm text-gray-600">
                        {charge.reason}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-red-600">
                        -${charge.formattedAmount}
                      </div>
                      <div className={`text-sm ${charge.statusClassName}`}>
                        {charge.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full rounded-md bg-green-600 px-4 py-2 text-white">
                Mark Complete
              </button>
              <button className="w-full rounded-md border border-red-600 px-4 py-2 text-red-600">
                Admit Failure
              </button>
              <button className="w-full rounded-md border px-4 py-2">
                Request Extension
              </button>
              <button className="w-full rounded-md border px-4 py-2 text-red-600">
                Cancel Goal
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-4">Goal Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-3 h-3 rounded-full bg-green-500 mt-1 mr-3"></div>
                <div>
                  <div className="font-medium">Goal Created</div>
                  <div className="text-sm text-gray-600">
                    {goalCreatedLabel}
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 mr-3"></div>
                <div>
                  <div className="font-medium">Payment Authorized</div>
                  <div className="text-sm text-gray-600">
                    Stripe subscription active
                  </div>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-3 h-3 rounded-full border-2 border-gray-400 mt-1 mr-3"></div>
                <div>
                  <div className="font-medium">Deadline</div>
                  <div className="text-sm text-gray-600">
                    {formattedDeadline}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
