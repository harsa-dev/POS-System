import * as WorkforceExtras from "@/features/shared/workforce-operations/workforce-operation-extras";
import * as WorkforceDashboards from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function PayrollPage() {
  return (
    <>
      <WorkforceDashboards.PayrollDashboard />
      <WorkforceExtras.PayrollExtras />
    </>
  );
}
