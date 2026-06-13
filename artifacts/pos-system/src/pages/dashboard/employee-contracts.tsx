import * as WorkforceExtras from "@/features/shared/workforce-operations/workforce-operation-extras";
import * as WorkforceDashboards from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function EmployeeContractsPage() {
  return (
    <>
      <WorkforceDashboards.EmployeeContractsDashboard />
      <WorkforceExtras.EmployeeContractsExtras />
    </>
  );
}
