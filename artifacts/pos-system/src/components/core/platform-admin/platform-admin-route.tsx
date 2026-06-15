import type { ReactNode } from "react";
import { Redirect } from "wouter";

import { ROUTES } from "@/constants/routes";

import {
  canAccessPlatformAdminCapability,
  type PlatformAdminCapability,
} from "./platform-admin-policy";

type PlatformAdminRouteUser = {
  role: string;
} | null;

function PlatformAdminForbiddenPanel({
  capability,
  role,
}: {
  capability: PlatformAdminCapability;
  role?: string | null;
}) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center p-6">
      <section className="w-full max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">
          Platform Admin Restricted
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Internal Monitoring requires platform admin access.
        </h1>
        <p className="mt-3 text-sm leading-6 text-amber-800">
          This dashboard exposes internal platform health, route inventory, API readiness,
          and schema risk. Your current role {role ? `(${role})` : ""} is not allowed to
          access capability <span className="font-mono font-semibold">{capability}</span>.
        </p>
        <p className="mt-4 text-xs font-semibold text-amber-700">
          Allowed frontend roles for this phase: OWNER, ADMIN. Backend policy must still enforce the same boundary.
        </p>
      </section>
    </div>
  );
}

export function PlatformAdminRoute({
  children,
  capability,
  user,
  isLoading,
}: {
  children: ReactNode;
  capability: PlatformAdminCapability;
  user: PlatformAdminRouteUser;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-sm text-neutral-400">Loading platform admin access...</div>
      </div>
    );
  }

  if (!user) return <Redirect to={ROUTES.LOGIN} />;

  if (!canAccessPlatformAdminCapability({ role: user.role, capability })) {
    return <PlatformAdminForbiddenPanel capability={capability} role={user.role} />;
  }

  return <>{children}</>;
}
