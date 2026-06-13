import { DevMonitoringDashboard } from "@/features/shared/platform-monitoring/dev-monitoring-dashboard";
import { DevMonitoringDeepDive } from "@/features/shared/platform-monitoring/dev-monitoring-deep-dive";
import { InternalMonitoringControlRoom } from "@/features/shared/platform-monitoring/internal-monitoring-control-room";
import { InternalMonitoringUpgradeBoard } from "@/features/shared/platform-monitoring/internal-monitoring-upgrade-board";

export default function PlatformMonitoringPage() {
  return (
    <>
      <DevMonitoringDashboard />
      <DevMonitoringDeepDive />
      <InternalMonitoringUpgradeBoard />
      <InternalMonitoringControlRoom />
    </>
  );
}
