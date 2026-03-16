// components/jobs/job-status-icon.tsx
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
} from "lucide-react";

interface JobStatusIconProps {
  status: string;
}

export function JobStatusIcon({ status }: JobStatusIconProps) {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4" />;
    case "failed":
      return <AlertCircle className="w-4 h-4" />;
    case "processing":
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    case "pending":
      return <Clock className="w-4 h-4" />;
    case "retry":
      return <RefreshCw className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
}
