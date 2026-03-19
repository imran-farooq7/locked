// components/admin/user-row.tsx
"use client";

import { Eye, MoreVertical, Shield, UserMinus, UserPlus } from "lucide-react";
import { format } from "date-fns";

function formatDate(value: string | undefined, formatString: string) {
  if (!value) return "-";
  return format(new Date(value), formatString);
}

function getUserInitial(user: { full_name: string | null; email: string }) {
  const source = user.full_name?.trim() || user.email;
  return source[0]?.toUpperCase() ?? "?";
}

export type UserRowProps = {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string | undefined;
    last_sign_in_at: string | undefined;
    is_admin: boolean;
    is_active: boolean;
    goal_count: number;
    total_penalties: number;
  };
  isSelected: boolean;
  onToggleSelect: (userId: string) => void;
  onToggleAdmin: (userId: string, makeAdmin: boolean) => void;
  onToggleStatus: (userId: string, isActive: boolean) => void;
};

export default function UserRow({
  user,
  isSelected,
  onToggleSelect,
  onToggleAdmin,
  onToggleStatus,
}: UserRowProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(user.id)}
          className="rounded"
        />
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {getUserInitial(user)}
          </div>
          <div>
            <div className="font-medium">{user.full_name || "No name"}</div>
            <div className="text-sm text-gray-600">{user.email}</div>
            {user.is_admin && (
              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                Admin
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <div className="text-sm">
          {formatDate(user.created_at, "MMM d, yyyy")}
        </div>
        {user.last_sign_in_at && (
          <div className="text-xs text-gray-500">
            Last active: {formatDate(user.last_sign_in_at, "MMM d")}
          </div>
        )}
      </td>

      <td className="px-6 py-4">
        <div className="font-medium">{user.goal_count}</div>
        <div className="text-xs text-gray-500">goals created</div>
      </td>

      <td className="px-6 py-4">
        <div className="font-medium text-red-600">
          ${(user.total_penalties / 100).toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">total penalties</div>
      </td>

      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            user.is_active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {user.is_active ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.open(`/dashboard/users/${user.id}`, "_blank")}
            className="p-1 hover:bg-gray-100 rounded"
            title="View profile"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleAdmin(user.id, !user.is_admin)}
            className="p-1 hover:bg-gray-100 rounded"
            title={user.is_admin ? "Remove admin" : "Make admin"}
          >
            <Shield className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleStatus(user.id, !user.is_active)}
            className="p-1 hover:bg-gray-100 rounded"
            title={user.is_active ? "Deactivate" : "Activate"}
          >
            {user.is_active ? (
              <UserMinus className="w-4 h-4" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </button>

          <button className="p-1 hover:bg-gray-100 rounded">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
