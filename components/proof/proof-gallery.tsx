// components/proof/proof-gallery.tsx
"use client";

import { createSupabaseClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { useState, useEffect, useMemo, useCallback } from "react";

interface ProofGalleryProps {
  goalId: string;
}

interface ProofItem {
  id: string;
  created_at: string | null;
  submission_text?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  verification_status: string | null;
  verified_at: string | null;
}

// memoized supabase client hook
function useSupabaseClient() {
  return useMemo(() => createSupabaseClient(), []);
}

const statusStyles: Record<string, string> = {
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

interface ProofCardProps {
  proof: ProofItem;
  onImageClick: (url: string) => void;
}

function ProofCard({ proof, onImageClick }: ProofCardProps) {
  const date = proof.created_at
    ? format(new Date(proof.created_at), "PPP p")
    : "";
  const verifiedDate = proof.verified_at
    ? format(new Date(proof.verified_at), "MMM d")
    : null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-sm text-gray-600">{date}</div>
            <div
              className={`text-xs px-2 py-1 rounded inline-block mt-1 ${
                statusStyles[proof.verification_status ?? "pending"]
              }`}
            >
              {proof.verification_status}
            </div>
          </div>
          {verifiedDate && (
            <div className="text-xs text-gray-500">Verified {verifiedDate}</div>
          )}
        </div>
      </div>

      <div className="p-4">
        {proof.file_url && proof.file_type?.startsWith("image/") && (
          <div className="mb-4">
            <div
              className="relative h-48 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onImageClick(proof.file_url!)}
            >
              <img
                src={proof.file_url}
                alt="Proof"
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all" />
            </div>
          </div>
        )}

        {proof.file_url && !proof.file_type?.startsWith("image/") && (
          <div className="mb-4">
            <a
              href={proof.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="text-2xl">📎</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {proof.file_url.split("/").pop()}
                </div>
                <div className="text-sm text-gray-600">Click to download</div>
              </div>
            </a>
          </div>
        )}

        {proof.submission_text && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              Description:
            </h4>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">
              {proof.submission_text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProofGallery({ goalId }: ProofGalleryProps) {
  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const supabase = useSupabaseClient();

  const loadProofs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("goal_submissions")
      .select("*")
      .eq("goal_id", goalId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProofs(data);
    }
    setLoading(false);
  }, [supabase, goalId]);

  // load on mount and subscribe to changes
  useEffect(() => {
    loadProofs();

    const channel = supabase
      .channel(`proofs-${goalId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "goal_submissions",
          filter: `goal_id=eq.${goalId}`,
        },
        loadProofs,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadProofs, supabase, goalId]);

  const handleImageClick = useCallback((url: string) => {
    setSelectedImage(url);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-4">
            <div className="h-48 bg-gray-200 rounded mb-3"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (proofs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <div className="text-4xl mb-4">📝</div>
        <p className="text-gray-600">No proof submissions yet</p>
      </div>
    );
  }

  return (
    <div>
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white text-2xl"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Proof"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proofs.map((proof) => (
          <ProofCard
            key={proof.id}
            proof={proof}
            onImageClick={handleImageClick}
          />
        ))}
      </div>
    </div>
  );
}
