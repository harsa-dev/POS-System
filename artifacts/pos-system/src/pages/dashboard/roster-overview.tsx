import { ShiftOverviewExtras } from "@/features/shared/workforce-operations/workforce-operation-extras";
import { ShiftOverviewDashboard } from "@/features/shared/workforce-operations/workforce-operations-dashboards";

export default function RosterOverviewPage() {
  return (
    <>
      <ShiftOverviewDashboard />
      <ShiftOverviewExtras />
    </>
  );
}
