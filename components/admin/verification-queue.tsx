// components/admin/verification-queue.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { VerificationModal } from "./VerificationModal";
import { QueueItem } from "./QueueItem";

export interface PendingProof {
  id: string;
  created_at: string;
  submission_text?: string;
  file_url?: string;
  file_type?: string;
  verification_status: "pending";
  goal: {
    id: string;
    title: string;
    user_id: string;
    penalty_amount: number;
  };
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
}

// Memoized supabase client hook
function useSupabaseClient() {
  return useMemo(() => createSupabaseClient(), []);
}

export default function VerificationQueue() {
  const [pendingProofs, setPendingProofs] = useState<PendingProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<PendingProof | null>(null);

  const supabase = useSupabaseClient();

  const loadPendingProofs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("goal_submissions")
        .select(
          `
        *,
        goal:goals(id, title, user_id, penalty_amount),
        user:profiles!goal_submissions_user_id_fkey(id, email, full_name)
      `,
        )
        .eq("verification_status", "pending")
        .order("created_at", { ascending: true })
        .limit(20);

      if (!error && data) {
        setPendingProofs(data as PendingProof[]);
      }
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const handleApprove = useCallback(
    async (proofId: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
          .from("goal_submissions")
          .update({
            verification_status: "approved",
            verified_at: new Date().toISOString(),
            verified_by: user.id,
          })
          .eq("id", proofId);

        if (error) throw error;

        await loadPendingProofs();
        setSelectedProof(null);
      } catch (err) {
        console.error("Approval error:", err);
        alert("Failed to approve proof");
      }
    },
    [supabase, loadPendingProofs],
  );

  const handleReject = useCallback(
    async (proofId: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error: updateError } = await supabase
          .from("goal_submissions")
          .update({
            verification_status: "rejected",
            verified_at: new Date().toISOString(),
            verified_by: user.id,
          })
          .eq("id", proofId);

        if (updateError) throw updateError;

        const proof = pendingProofs.find((p) => p.id === proofId);
        if (proof) {
          const { error: goalError } = await supabase
            .from("goals")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", proof.goal.id);

          if (goalError) throw goalError;
        }

        await loadPendingProofs();
        setSelectedProof(null);
      } catch (err) {
        console.error("Rejection error:", err);
        alert("Failed to reject proof");
      }
    },
    [supabase, pendingProofs, loadPendingProofs],
  );

  useEffect(() => {
    loadPendingProofs();
  }, [loadPendingProofs]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-4">
            <div className="h-4 bg-gray-200 rounded mb-3"></div>
            <div className="h-3 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (pendingProofs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-gray-600">No pending verifications</p>
        <p className="text-sm text-gray-500 mt-2">
          All proofs have been reviewed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <VerificationModal
        proof={selectedProof}
        onClose={() => setSelectedProof(null)}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Pending Verifications ({pendingProofs.length})
          </h3>
          <button
            onClick={() => loadPendingProofs()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Refresh
          </button>
        </div>

        {pendingProofs.map((proof) => (
          <QueueItem
            key={proof.id}
            proof={proof}
            onSelect={setSelectedProof}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}
      </div>
    </div>
  );
}
