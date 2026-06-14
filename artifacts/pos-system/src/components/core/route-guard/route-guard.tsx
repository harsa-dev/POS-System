import { Redirect, useLocation } from "wouter";

import { DashboardShell } from "@/components/core/app-shell/dashboard-shell";
import { ROUTES } from "@/constants/routes";
import type { BusinessModeId } from "../business-mode/business-mode.types";
import { repairBusinessModeStorage } from "../business-mode/business-mode-storage";
import { businessModeService } from "../business-mode/business-mode-service";

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
  const [pathname] = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!user) return <Redirect to={ROUTES.LOGIN} />;

  const workspaceState = businessModeService.getWorkspaceState();

  if (workspaceState.wasLegacy) {
    repairBusinessModeStorage("route-guard");
  }

  const routeAccess = businessModeService.canEnterRoute({
    pathname,
    requiredMode,
  });

  if (!routeAccess.canEnter) {
    return <Redirect to={businessModeService.getSelectModeRoute(pathname)} />;
  }

  if (!withShell) return <>{children}</>;

  return (
    <DashboardShell userName={user.name} role={user.role}>
      {children}
    </DashboardShell>
  );
}
