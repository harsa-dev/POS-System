import { Redirect } from "wouter";

import { DashboardShell } from "@/components/core/app-shell/dashboard-shell";
import { ROUTES } from "@/constants/routes";
import type { BusinessMode } from "./business-mode";
import { getStoredBusinessMode } from "./business-mode";

type RouteGuardUser = {
  name: string;
  role: string;
};

type RouteGuardProps = {
  user: RouteGuardUser | null;
  isLoading: boolean;
  children: React.ReactNode;
  requiredMode?: BusinessMode;
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

  const currentMode = getStoredBusinessMode();

  if (!currentMode) return <Redirect to={ROUTES.SELECT_MODE} />;
  if (requiredMode && currentMode !== requiredMode) return <Redirect to={ROUTES.ANALYTICS} />;

  if (!withShell) return <>{children}</>;

  return (
    <DashboardShell userName={user.name} role={user.role}>
      {children}
    </DashboardShell>
  );
}

