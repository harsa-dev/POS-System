import { ShiftReportsExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { ShiftReportsDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function ShiftReportsPage() {
  return (
    <>
      <ShiftReportsDashboard />
      <ShiftReportsExtras />
    </>
  );
}
