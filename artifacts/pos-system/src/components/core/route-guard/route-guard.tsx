import { Redirect } from "wouter";

import { DashboardShell } from "@/components/core/app-shell/dashboard-shell";
import { ROUTES } from "@/constants/routes";
import type { BusinessModeId } from "../business-mode/business-mode.types";
import { readBusinessModeStorage, repairBusinessModeStorage } from "../business-mode/business-mode-storage";

type RouteGuardUser = {
  name: string;
  role: string;
};

type RouteGuardProps = {
  user: RouteGuardUser | null;
  isLoading: boolean;
  children: React.ReactNode;
  requiredMode?: BusinessModeId;
  withShell?: boolean;
};

export function RouteGuard({
  user,
  isLoading,
  children,
  requiredMode,
  withShell = true,
}: RouteGuardProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!user) return <Redirect to={ROUTES.LOGIN} />;

  const businessModeState = readBusinessModeStorage();

  if (businessModeState.wasLegacy) {
    repairBusinessModeStorage("route-guard");
  }

  if (!businessModeState.storedValue || businessModeState.wasFallback) {
    return <Redirect to={ROUTES.SELECT_MODE} />;
  }

  if (requiredMode && businessModeState.mode !== requiredMode) {
    return <Redirect to={ROUTES.SELECT_MODE} />;
  }

  if (!withShell) return <>{children}</>;

  return (
    <DashboardShell userName={user.name} role={user.role}>
      {children}
    </DashboardShell>
  );
}
