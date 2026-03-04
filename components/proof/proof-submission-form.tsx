// components/proof/proof-submission-form.tsx
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { uploadProofFile } from "@/lib/storage/upload-utils";
import { createSupabaseClient } from "@/lib/supabase/client";
import { Goal } from "@/lib/database.types";

interface ProofSubmissionFormProps {
  goal: Goal;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// re-used type alias for convenience
type ProofType = Goal["proof_type"];

// memoized client hook keeps a single instance per render tree
function useSupabaseClientMemo() {
  return useMemo(() => createSupabaseClient(), []);
}

interface TextSectionProps {
  proofType: ProofType;
  description: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

function TextSection({ proofType, description, onChange }: TextSectionProps) {
  if (proofType !== "text" && proofType) return null;

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Describe how you completed this goal *
      </label>
      <textarea
        value={description}
        onChange={onChange}
        className="w-full border rounded-lg p-3 min-h-37.5"
        placeholder="Provide details about how you achieved your goal..."
        required={proofType === "text"}
      />
      <p className="text-gray-500 text-sm mt-1">
        Be specific and detailed. This helps with verification.
      </p>
    </div>
  );
}

interface FileSectionProps {
  proofType: ProofType;
  uploadedFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description: string;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

function FileSection({
  proofType,
  uploadedFile,
  onFileChange,
  description,
  onDescriptionChange,
}: FileSectionProps) {
  if (proofType !== "image" && proofType !== "file") return null;

  const isImage = proofType === "image";

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Upload {isImage ? "Image" : "File"} *
      </label>

      <div className="border-2 border-dashed rounded-lg p-6 text-center">
        <input
          type="file"
          id="proof-file"
          accept={isImage ? "image/*" : "*/*"}
          onChange={onFileChange}
          className="hidden"
        />

        <label htmlFor="proof-file" className="cursor-pointer">
          {uploadedFile ? (
            <div className="space-y-2">
              <div className="text-green-600 font-medium">
                ✓ {uploadedFile.name}
              </div>
              <div className="text-sm text-gray-600">
                {(uploadedFile.size / 1024).toFixed(1)} KB • Click to change
                file
              </div>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-2">📎</div>
              <div className="font-medium">Click to upload file</div>
              <div className="text-sm text-gray-600 mt-1">
                Max 10MB • {isImage ? "Images only" : "Any file type"}
              </div>
            </div>
          )}
        </label>
      </div>

      {/* Image-specific description */}
      {isImage && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Image Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={onDescriptionChange}
            className="w-full border rounded-lg p-3"
            placeholder="Describe what this image shows..."
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

export default function ProofSubmissionForm({
  goal,
  onSuccess,
  onCancel,
}: ProofSubmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const supabase = useSupabaseClientMemo();

  const proofType = goal.proof_type;
  const fileRequired = proofType === "image" || proofType === "file";
  const textRequired = proofType === "text" || !proofType;
  const isFormValid =
    (!fileRequired || uploadedFile !== null) &&
    (!textRequired || description.trim().length > 0);

  // clear any existing error when user starts editing again
  useEffect(() => {
    if (error) setError(null);
  }, [description, uploadedFile]);

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDescription(e.target.value);
    },
    [],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file
      if (proofType === "image" && !file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      setUploadedFile(file);
      setError(null);
    },
    [proofType],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // guard double-submit
    setError(null);

    if (!isFormValid) {
      setError("Please fill out all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let fileUrl: string | null = null;
      let fileType: string | null = null;

      if (fileRequired) {
        if (!uploadedFile) throw new Error("Please upload a file");

        const uploadResult = await uploadProofFile(
          uploadedFile,
          user.id,
          goal.id,
        );
        if (!uploadResult.success) {
          throw new Error(uploadResult.error.message || "File upload failed");
        }

        fileUrl = uploadResult.data.url;
        fileType = uploadedFile.type;
      }

      const { error: submissionError } = await supabase
        .from("goal_submissions")
        .insert({
          goal_id: goal.id,
          user_id: user.id,
          submission_text: description,
          file_url: fileUrl,
          file_type: fileType,
          verification_status: "pending",
        });

      if (submissionError) throw submissionError;

      const { error: goalError } = await supabase
        .from("goals")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);

      if (goalError) throw goalError;

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Submit Proof for: {goal.title}
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Required proof type:{" "}
          <span className="font-medium capitalize">{proofType}</span>
        </p>
      </div>

      <TextSection
        proofType={proofType}
        description={description}
        onChange={handleDescriptionChange}
      />

      <FileSection
        proofType={proofType}
        uploadedFile={uploadedFile}
        onFileChange={handleFileChange}
        description={description}
        onDescriptionChange={handleDescriptionChange}
      />

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className="flex-1 bg-black text-white rounded-lg py-3 font-medium disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Proof"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 border rounded-lg font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
