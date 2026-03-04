// components/admin/verification-queue.tsx
"use client";
import { format } from "date-fns";
import { useState } from "react";
import { PendingProof } from "./verification-queue";
export interface VerificationModalProps {
  proof: PendingProof | null;
  onClose: () => void;
  onApprove: (proofId: string) => Promise<void>;
  onReject: (proofId: string) => Promise<void>;
}
export function VerificationModal({
  proof,
  onClose,
  onApprove,
  onReject,
}: VerificationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!proof) return null;

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(proof.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      await onReject(proof.id);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-semibold">Verify Proof Submission</h3>
              <p className="text-gray-600">Goal: {proof.goal.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">User Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>{" "}
                  {proof.user.full_name || "Not provided"}
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>{" "}
                  {proof.user.email}
                </div>
                <div>
                  <span className="text-gray-600">Submitted:</span>{" "}
                  {format(new Date(proof.created_at), "PPP p")}
                </div>
                <div>
                  <span className="text-gray-600">Penalty Amount:</span> $
                  {(proof.goal.penalty_amount / 100).toFixed(2)}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Proof Content</h4>

              {proof.submission_text && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Description:</div>
                  <div className="border rounded-lg p-4 bg-gray-50 whitespace-pre-wrap">
                    {proof.submission_text}
                  </div>
                </div>
              )}

              {proof.file_url && (
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    Attached File:
                  </div>
                  {proof.file_type?.startsWith("image/") ? (
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={proof.file_url}
                        alt="Proof"
                        className="w-full max-h-64 object-contain"
                      />
                    </div>
                  ) : (
                    <a
                      href={proof.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <span>📎</span>
                      <span>Download File</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 text-white rounded-lg py-3 font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "✓ Approve Proof"}
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 text-white rounded-lg py-3 font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "✗ Reject Proof"}
              </button>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-3 border rounded-lg font-medium disabled:opacity-50"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
