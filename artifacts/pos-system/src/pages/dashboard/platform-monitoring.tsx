import { DevMonitoringDashboard } from "@/features/shared/platform-monitoring/dev-monitoring-dashboard";
import { DevMonitoringDeepDive } from "@/features/shared/platform-monitoring/dev-monitoring-deep-dive";

export default function PlatformMonitoringPage() {
  return (
    <>
      <DevMonitoringDashboard />
      <DevMonitoringDeepDive />
    </>
  );
}
