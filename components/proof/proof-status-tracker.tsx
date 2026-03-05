// components/proof/proof-status-tracker.tsx
"use client";

import { useState, useEffect } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { format, differenceInHours } from "date-fns";

interface ProofStatusTrackerProps {
  goalId: string;
}

export default function ProofStatusTracker({
  goalId,
}: ProofStatusTrackerProps) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createSupabaseClient();

  useEffect(() => {
    loadSubmissions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`proof-status-${goalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "goal_submissions",
          filter: `goal_id=eq.${goalId}`,
        },
        () => loadSubmissions(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [goalId]);

  const loadSubmissions = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("goal_submissions")
      .select("*")
      .eq("goal_id", goalId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSubmissions(data);
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      case "pending":
        return "⏳";
      default:
        return "📝";
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No proof submissions yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Proof Submission History</h3>

      <div className="space-y-3">
        {submissions.map((submission) => {
          const hoursAgo = differenceInHours(
            new Date(),
            new Date(submission.created_at),
          );

          return (
            <div key={submission.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {getStatusIcon(submission.verification_status)}
                  </span>
                  <div>
                    <div className="font-medium">
                      {format(new Date(submission.created_at), "PPP p")}
                    </div>
                    <div className="text-sm text-gray-600">
                      {hoursAgo < 1
                        ? "Just now"
                        : hoursAgo < 24
                          ? `${hoursAgo} hours ago`
                          : `${Math.floor(hoursAgo / 24)} days ago`}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 text-sm rounded-full ${getStatusColor(submission.verification_status)}`}
                >
                  {submission.verification_status.toUpperCase()}
                </span>
              </div>

              {/* Proof Content Preview */}
              {submission.submission_text && (
                <div className="mb-3">
                  <p className="text-gray-700 line-clamp-2">
                    {submission.submission_text}
                  </p>
                </div>
              )}

              {submission.file_url && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>📎</span>
                  <span className="truncate">
                    {submission.file_url.split("/").pop()}
                  </span>
                </div>
              )}

              {/* Verification Details */}
              {submission.verified_at && (
                <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                  <div>
                    Verified: {format(new Date(submission.verified_at), "PPP")}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
