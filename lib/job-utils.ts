// lib/job-utils.ts
export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "retry";

export const JOB_STATUSES: JobStatus[] = [
  "pending",
  "processing",
  "completed",
  "failed",
  "retry",
];

export function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "text-green-600 bg-green-50 border-green-200";
    case "failed":
      return "text-red-600 bg-red-50 border-red-200";
    case "processing":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "pending":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "retry":
      return "text-orange-600 bg-orange-50 border-orange-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function formatJobType(jobType: string): string {
  return jobType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function triggerJobAction(
  endpoint: string,
  successMessage: string,
): Promise<boolean> {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      alert(successMessage);
      return true;
    } else {
      alert(`Failed to ${endpoint.split("/").pop()}`);
      return false;
    }
  } catch (error) {
    console.error(`Error triggering ${endpoint}:`, error);
    alert("An error occurred");
    return false;
  }
}
