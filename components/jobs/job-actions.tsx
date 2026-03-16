// components/jobs/job-actions.tsx
import { memo, useCallback } from "react";
import { triggerJobAction } from "@/lib/job-utils";

interface JobActionsProps {
  onActionComplete: () => void;
}

interface JobAction {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  successMessage: string;
}

const JOB_ACTIONS: JobAction[] = [
  {
    id: "process-penalties",
    title: "Process Pending Penalties",
    description: "Immediately process due penalties",
    endpoint: "/api/jobs/trigger-penalties",
    successMessage: "Penalty processing triggered",
  },
  {
    id: "retry-failed",
    title: "Retry Failed Jobs",
    description: "Retry jobs that failed previously",
    endpoint: "/api/jobs/retry-failed",
    successMessage: "Failed jobs queued for retry",
  },
  {
    id: "cleanup",
    title: "Cleanup Old Jobs",
    description: "Remove completed jobs older than 30 days",
    endpoint: "/api/jobs/cleanup",
    successMessage: "Old jobs cleaned up",
  },
];

export const JobActions = memo(function JobActions({
  onActionComplete,
}: JobActionsProps) {
  const handleAction = useCallback(
    async (action: JobAction) => {
      const success = await triggerJobAction(
        action.endpoint,
        action.successMessage,
      );
      if (success) {
        onActionComplete();
      }
    },
    [onActionComplete],
  );

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Job Management</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {JOB_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => handleAction(action)}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <div className="font-medium">{action.title}</div>
            <div className="text-sm text-gray-600 mt-1">
              {action.description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
