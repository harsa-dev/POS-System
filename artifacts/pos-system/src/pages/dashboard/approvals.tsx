import { ApprovalExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { ApprovalDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function ApprovalsPage() {
  return (
    <>
      <ApprovalDashboard />
      <ApprovalExtras />
    </>
  );
}
