// components/admin/verification-queue.tsx
"use client";
import { format } from "date-fns";
import { PendingProof } from "./verification-queue";

interface QueueItemProps {
  proof: PendingProof;
  onSelect: (proof: PendingProof) => void;
  onApprove: (proofId: string) => Promise<void>;
  onReject: (proofId: string) => Promise<void>;
}
export function QueueItem({
  proof,
  onSelect,
  onApprove,
  onReject,
}: QueueItemProps) {
  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onApprove(proof.id);
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onReject(proof.id);
  };

  return (
    <div
      className="border rounded-lg p-4 hover:border-gray-400 cursor-pointer transition-colors"
      onClick={() => onSelect(proof)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{proof.goal.title}</h4>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <span>{proof.user.email}</span>
            <span>•</span>
            <span>{format(new Date(proof.created_at), "MMM d, h:mm a")}</span>
            <span>•</span>
            <span className="text-red-600 font-medium">
              Penalty: ${(proof.goal.penalty_amount / 100).toFixed(2)}
            </span>
          </div>

          {proof.submission_text && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
              {proof.submission_text}
            </p>
          )}
        </div>

        <div className="flex space-x-2 ml-4">
          <button
            onClick={handleApprove}
            className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
