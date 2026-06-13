import { EmployeeAttendanceExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { EmployeeAttendanceDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function EmployeeAttendancePage() {
  return (
    <>
      <EmployeeAttendanceDashboard />
      <EmployeeAttendanceExtras />
    </>
  );
}
