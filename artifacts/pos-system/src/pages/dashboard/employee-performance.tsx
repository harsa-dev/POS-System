import { EmployeePerformanceExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { EmployeePerformanceDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function EmployeePerformancePage() {
  return (
    <>
      <EmployeePerformanceDashboard />
      <EmployeePerformanceExtras />
    </>
  );
}
