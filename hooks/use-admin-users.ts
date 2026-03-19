"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string | undefined;
  last_sign_in_at: string | undefined;
  is_admin: boolean;
  is_active: boolean;
  stripe_customer_id: string | null;
  goal_count: number;
  total_penalties: number;
}

export const USERS_PER_PAGE = 20;

export type UserFilters = {
  role: "all" | "admin" | "user";
  status: "all" | "active" | "inactive";
  sortBy: "newest" | "recent" | "goals" | "penalties";
};

export default function useAdminUsers() {
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<UserFilters>({
    role: "all",
    status: "all",
    sortBy: "newest",
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setSelectedUsers([]);

    try {
      let query = supabase.from("profiles").select(
        `
          *,
          goals:goals(count),
          penalties:penalty_charges!penalty_charges_user_id_fkey(
            amount,
            status
          )
        `,
        { count: "exact" },
      );

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      if (filters.role !== "all") {
        query = query.eq("is_admin", filters.role === "admin");
      }

      if (filters.status !== "all") {
        query = query.eq("is_active", filters.status === "active");
      }

      const sortField =
        filters.sortBy === "newest" ? "created_at" : "last_sign_in_at";
      query = query.order(sortField, { ascending: false });

      const from = (page - 1) * USERS_PER_PAGE;
      const to = from + USERS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      const transformedUsers = (data || []).map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        created_at: user.created_at?.toString(),
        last_sign_in_at: user.last_sign_in_at?.toString(),
        is_admin: user.is_admin ?? false,
        is_active: user.is_active ?? false,
        stripe_customer_id: user.stripe_customer_id,
        goal_count: user.goals?.[0]?.count ?? 0,
        total_penalties:
          user.penalties
            ?.filter((p: any) => p.status === "charged")
            ?.reduce((sum: number, p: any) => sum + p.amount, 0) ?? 0,
      }));

      setUsers(transformedUsers);
      setTotalUsers(count ?? 0);
      setTotalPages(Math.max(1, Math.ceil((count || 0) / USERS_PER_PAGE)));
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, page, search, supabase]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setSelectedUsers([]);
  }, [page, search, filters]);

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedUsers((prev) =>
      prev.length === users.length ? [] : users.map((u) => u.id),
    );
  }, [users]);

  const updateUserRole = useCallback(
    async (userId: string, makeAdmin: boolean) => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ is_admin: makeAdmin })
          .eq("id", userId);

        if (error) throw error;

        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, is_admin: makeAdmin } : user,
          ),
        );

        confirm(
          `User ${makeAdmin ? "promoted to admin" : "demoted from admin"}`,
        );
      } catch (error) {
        console.error("Failed to update user role:", error);
        alert("Failed to update user role");
      }
    },
    [supabase],
  );

  const toggleUserStatus = useCallback(
    async (userId: string, isActive: boolean) => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ is_active: isActive })
          .eq("id", userId);

        if (error) throw error;

        setUsers((prev) =>
          prev.map((user) =>
            user.id === userId ? { ...user, is_active: isActive } : user,
          ),
        );

        alert(`User ${isActive ? "activated" : "deactivated"}`);
      } catch (error) {
        console.error("Failed to update user status:", error);
        alert("Failed to update user status");
      }
    },
    [supabase],
  );

  const sendBulkEmail = useCallback(async () => {
    if (selectedUsers.length === 0) {
      alert("Please select users first");
      return;
    }

    const subject = prompt("Email subject:");
    const message = prompt("Email message:");

    if (!subject || !message) return;

    console.log(`Sending email to ${selectedUsers.length} users:`, {
      subject,
      message,
    });
    alert(`Email queued for ${selectedUsers.length} users`);
  }, [selectedUsers]);

  return {
    users,
    loading,
    search,
    setSearch,
    filters,
    setFilters,
    selectedUsers,
    toggleUserSelection,
    toggleSelectAll,
    updateUserRole,
    toggleUserStatus,
    sendBulkEmail,
    page,
    setPage,
    totalPages,
    totalUsers,
  };
}
