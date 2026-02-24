// components/goals/goal-card.tsx
"use client";

import { useState } from "react";
import type { Goal } from "@/lib/database.types";
import { calculateTimeRemaining, isGoalExpired } from "@/lib/goal-utils";
import { format } from "date-fns";
import { createSupabaseClient } from "@/lib/supabase/client";

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProofForm, setShowProofForm] = useState(false);
  const [proofText, setProofText] = useState("");

  const supabase = createSupabaseClient();
  const deadline = new Date(goal.target_date);
  const timeRemaining = calculateTimeRemaining(deadline);
  const isExpired = isGoalExpired(deadline);

  const handleCompleteGoal = async () => {
    if (!goal.proof_required) {
      await markGoalComplete();
      return;
    }

    setShowProofForm(true);
  };

  const markGoalComplete = async (proofData?: any) => {
    setIsSubmitting(true);

    try {
      // Update goal status
      const { error: goalError } = await supabase
        .from("goals")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      if (goalError) throw goalError;

      // If proof was provided, create submission
      if (proofData) {
        await supabase.from("goal_submissions").insert({
          goal_id: goal.id,
          user_id: goal.user_id,
          submission_text: proofData.text,
          file_url: proofData.fileUrl,
          file_type: proofData.fileType,
          verification_status: "pending",
        });
      }

      // Cancel Stripe subscription if it exists
      if (goal.stripe_subscription_id) {
        // This will be handled by a webhook
      }
    } catch (error) {
      console.error("Failed to complete goal:", error);
    } finally {
      setIsSubmitting(false);
      setShowProofForm(false);
    }
  };

  const handleFailGoal = async () => {
    setIsSubmitting(true);

    try {
      // This will trigger the penalty charge via webhook
      const { error } = await supabase
        .from("goals")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      if (error) throw error;
    } catch (error) {
      console.error("Failed to mark goal as failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border p-6 hover:border-gray-400 transition-colors">
      {/* Goal Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">{goal.title}</h3>
          {goal.description && (
            <p className="text-gray-600 text-sm mt-1">{goal.description}</p>
          )}
        </div>

        <span
          className={`px-3 py-1 text-xs rounded-full ${
            goal.status === "active"
              ? "bg-green-100 text-green-800"
              : goal.status === "completed"
                ? "bg-blue-100 text-blue-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {goal.status}
        </span>
      </div>

      {/* Goal Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Deadline:</span>
          <span className="font-medium">
            {format(deadline, "MMM dd, yyyy h:mm a")}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Time remaining:</span>
          <span
            className={`font-medium ${
              isExpired ? "text-red-600" : "text-green-600"
            }`}
          >
            {timeRemaining}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Penalty:</span>
          <span className="font-medium text-red-600">
            ${(goal.penalty_amount / 100).toFixed(2)}
          </span>
        </div>

        {goal.proof_required && goal.proof_type && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Proof required:</span>
            <span className="font-medium capitalize">{goal.proof_type}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {goal.status === "active" && (
        <div className="space-y-2">
          <button
            onClick={handleCompleteGoal}
            disabled={isSubmitting}
            className="w-full rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Mark Complete"}
          </button>

          <button
            onClick={handleFailGoal}
            disabled={isSubmitting}
            className="w-full rounded-md border border-red-600 px-4 py-2 text-red-600 disabled:opacity-50"
          >
            Admit Failure
          </button>
        </div>
      )}

      {/* Proof Submission Form */}
      {showProofForm && (
        <div className="mt-4 p-4 border rounded-lg">
          <h4 className="font-medium mb-3">Submit Proof</h4>

          {goal.proof_type === "text" && (
            <textarea
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              className="w-full border rounded p-2 text-sm"
              rows={3}
              placeholder="Describe how you completed your goal..."
            />
          )}

          {goal.proof_type === "image" && (
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm"
              onChange={(e) => {
                // Handle image upload
              }}
            />
          )}

          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => markGoalComplete({ text: proofText })}
              disabled={!proofText.trim()}
              className="px-4 py-2 bg-black text-white text-sm rounded disabled:opacity-50"
            >
              Submit Proof
            </button>
            <button
              onClick={() => setShowProofForm(false)}
              className="px-4 py-2 border text-sm rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
