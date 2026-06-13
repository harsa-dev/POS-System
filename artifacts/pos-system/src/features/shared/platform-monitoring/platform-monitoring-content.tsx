import { DevMonitoringDashboard } from "./dev-monitoring-dashboard";
import { DevMonitoringDeepDive } from "./dev-monitoring-deep-dive";
import { InternalMonitoringControlRoom } from "./internal-monitoring-control-room";
import { InternalMonitoringUpgradeBoard } from "./internal-monitoring-upgrade-board";
import { InternalScaleReadinessBoard } from "./internal-scale-readiness-board";

export function PlatformMonitoringContent() {
  return (
    <>
      <DevMonitoringDashboard />
      <DevMonitoringDeepDive />
      <InternalMonitoringUpgradeBoard />
      <InternalMonitoringControlRoom />
      <InternalScaleReadinessBoard />
    </>
  );
}
