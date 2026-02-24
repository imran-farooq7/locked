// components/goals/goals-list.tsx
"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { Goal } from "@/lib/database.types";
import GoalCard from "./goal-card";

export default function GoalsList() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "active" | "completed" | "failed" | "all"
  >("active");

  const supabase = createSupabaseClient();

  useEffect(() => {
    loadGoals();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("goals-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "goals",
        },
        () => loadGoals(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const loadGoals = async () => {
    setLoading(true);

    let query = supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      setGoals(data as Goal[]);
    }

    setLoading(false);
  };

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const failedGoals = goals.filter((g) => g.status === "failed");

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 font-medium ${
            filter === "active"
              ? "border-b-2 border-black text-black"
              : "text-gray-500"
          }`}
        >
          Active ({activeGoals.length})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 font-medium ${
            filter === "completed"
              ? "border-b-2 border-black text-black"
              : "text-gray-500"
          }`}
        >
          Completed ({completedGoals.length})
        </button>
        <button
          onClick={() => setFilter("failed")}
          className={`px-4 py-2 font-medium ${
            filter === "failed"
              ? "border-b-2 border-black text-black"
              : "text-gray-500"
          }`}
        >
          Failed ({failedGoals.length})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 font-medium ${
            filter === "all"
              ? "border-b-2 border-black text-black"
              : "text-gray-500"
          }`}
        >
          All ({goals.length})
        </button>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border p-6">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-gray-500">
            No goals found. Create your first goal!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
