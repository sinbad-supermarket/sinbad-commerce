import type { SubmissionStatus } from "@/features/vendor-submissions/types";

type VendorSubmissionStatusProps = {
  status: SubmissionStatus;
};

export function VendorSubmissionStatus({ status }: VendorSubmissionStatusProps) {
  const className =
    status === "approved" || status === "submitted" ? "status-active" : "status-muted";

  return <span className={className}>{status}</span>;
}
