// lib/storage/upload-utils.ts
import { createSupabaseClient } from "@/lib/supabase/client";
import { Result, success, failure, tryCatch } from "@/lib/fp-utils";

export type FileType = "image" | "document" | "other";
export type ValidationResult = Result<{ isValid: true }, string>;

// Pure validation functions
export const validateFileSize = (
  file: File,
  maxSizeMB: number = 10,
): ValidationResult => {
  const maxSize = maxSizeMB * 1024 * 1024;
  return file.size <= maxSize
    ? success({ isValid: true })
    : failure(`File must be less than ${maxSizeMB}MB`);
};

export const validateFileType = (
  file: File,
  allowedTypes: string[] = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
  ],
): ValidationResult => {
  return allowedTypes.includes(file.type)
    ? success({ isValid: true })
    : failure(`File type ${file.type} not allowed`);
};

export const validateFileName = (fileName: string): ValidationResult => {
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
  return !invalidChars.test(fileName)
    ? success({ isValid: true })
    : failure("File name contains invalid characters");
};

export const getFileType = (mimeType: string): FileType => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return "document";
  return "other";
};

// Main upload function with functional composition
export const uploadProofFile = async (
  file: File,
  userId: string,
  goalId: string,
): Promise<Result<{ url: string; path: string; type: FileType }>> => {
  return tryCatch(async () => {
    // Step 1: Validate file
    const validations = [
      () => validateFileSize(file, 10),
      () => validateFileType(file),
      () => validateFileName(file.name),
    ];

    for (const validate of validations) {
      const result = validate();
      if (!result.success) return Promise.reject(new Error(result.error));
    }

    // Step 2: Determine bucket and generate path
    const fileType = getFileType(file.type);
    const bucket = fileType === "image" ? "proof-images" : "proof-files";

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileExt = file.name.split(".").pop();
    const fileName = `${timestamp}_${randomStr}.${fileExt}`;
    const filePath = `${userId}/${goalId}/${fileName}`;

    // Step 3: Upload to Supabase Storage
    const supabase = createSupabaseClient();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) throw error;

    // Step 4: Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
      type: fileType,
    };
  }, "Failed to upload file");
};
