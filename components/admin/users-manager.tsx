// components/admin/users-manager.tsx
"use client";

import { Search, Mail, UserPlus } from "lucide-react";
import useAdminUsers, {
  USERS_PER_PAGE,
  type UserFilters,
} from "@/hooks/use-admin-users";
import UserRow from "@/components/admin/user-row";
import UsersPagination from "@/components/admin/users-pagination";

export default function UsersManager() {
  const {
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
  } = useAdminUsers();

  const isInitialLoading = loading && users.length === 0;
  const isAllSelected =
    users.length > 0 && selectedUsers.length === users.length;
  const showingFrom = totalUsers === 0 ? 0 : (page - 1) * USERS_PER_PAGE + 1;
  const showingTo = Math.min(page * USERS_PER_PAGE, totalUsers);

  if (isInitialLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse h-20 bg-gray-200 rounded-lg"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={sendBulkEmail}
            disabled={selectedUsers.length === 0}
            className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            <span>Email Selected ({selectedUsers.length})</span>
          </button>

          <button className="flex items-center space-x-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800">
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <select
              value={filters.role}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  role: e.target.value as UserFilters["role"],
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins</option>
              <option value="user">Users</option>
            </select>
          </div>

          <div>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as UserFilters["status"],
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  sortBy: e.target.value as UserFilters["sortBy"],
                })
              }
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="newest">Newest First</option>
              <option value="recent">Recently Active</option>
              <option value="goals">Most Goals</option>
              <option value="penalties">Most Penalties</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  User
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Goals
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Penalties
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSelected={selectedUsers.includes(user.id)}
                    onToggleSelect={toggleUserSelection}
                    onToggleAdmin={updateUserRole}
                    onToggleStatus={toggleUserStatus}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UsersPagination
        page={page}
        totalPages={totalPages}
        totalUsers={totalUsers}
        showingFrom={showingFrom}
        showingTo={showingTo}
        onPageChange={setPage}
      />
    </div>
  );
}
