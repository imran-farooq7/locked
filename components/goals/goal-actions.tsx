// components/goals/simplified-goal-actions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { MoreVertical, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Goal } from "@/lib/database.types";

interface SimplifiedGoalActionsProps {
  goal: Goal;
  size?: "sm" | "md";
}

export default function SimplifiedGoalActions({
  goal,
  size = "md",
}: SimplifiedGoalActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleQuickAction = async (action: "complete" | "fail") => {
    try {
      const { error } = await supabase
        .from("goals")
        .update({
          status: action === "complete" ? "completed" : "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      if (error) throw error;

      router.refresh();
    } catch (error) {
      console.error("Failed to update goal:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const { error } = await supabase.from("goals").delete().eq("id", goal.id);

      if (error) throw error;

      router.refresh();
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  const buttonSize = size === "sm" ? "p-1" : "p-2";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${buttonSize} hover:bg-gray-100 rounded-lg transition-colors`}
      >
        <MoreVertical className={size === "sm" ? "w-4 h-4" : "w-5 h-5"} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20 py-2">
            {goal.status === "active" && (
              <>
                <button
                  onClick={() => handleQuickAction("complete")}
                  className="w-full text-left px-4 py-2 flex items-center space-x-2 hover:bg-gray-50 text-green-600"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark Complete</span>
                </button>

                <button
                  onClick={() => handleQuickAction("fail")}
                  className="w-full text-left px-4 py-2 flex items-center space-x-2 hover:bg-gray-50 text-red-600"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Mark Failed</span>
                </button>
              </>
            )}

            <button
              onClick={() => router.push(`/dashboard/goals/${goal.id}/edit`)}
              className="w-full text-left px-4 py-2 flex items-center space-x-2 hover:bg-gray-50 text-blue-600"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>

            <button
              onClick={handleDelete}
              className="w-full text-left px-4 py-2 flex items-center space-x-2 hover:bg-gray-50 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
