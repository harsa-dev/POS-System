import type { ReactNode } from "react";

import { getRawBusinessModeStorageValue } from "@/components/core/route-guard";
import {
  ServiceBusinessSharedDashboardBridge,
  ServiceBusinessSharedDashboardHiddenNotice,
  type ServiceBusinessSharedSurface,
} from "@/features/shared/service-business/service-business-shared-dashboard-bridge";
import {
  RawMaterialSharedDashboardBridge,
} from "@/features/shared/raw-material-bridge";
import type { RawMaterialSharedDashboardId } from "@/features/raw-material/core-system";
import {
  RestaurantSharedDashboardBridge,
} from "@/features/shared/restaurant-bridge";
import {
  RetailSharedDashboardBridge,
} from "@/features/shared/retail-bridge";
import type { RestaurantSharedDashboardId } from "@/lib/api";
import type { RetailSharedDashboardId } from "@/features/retail/core-system";
import {
  shouldCallServiceBusinessSharedSurface,
  shouldHideSharedDashboardForServiceMode,
} from "@/features/shared/service-business/service-business-shared-dashboard-config";
import { cn } from "@/lib/utils";

import {
  getSharedDashboardModeContext,
  type SharedDashboardModeContext,
  type SharedDashboardSurfaceId,
} from "./shared-dashboard-mode-context";

const serviceBusinessSurfaceByTitle: Record<string, ServiceBusinessSharedSurface> = {
  "Shared Business Dashboard": "business-overview",
  "Sales Analytics": "sales",
  "Customers & Partners": "customers",
  "Inventory Management": "inventory",
  Cashflow: "cashflow",
  "Financial Reports": "financial-reports",
  "Invoice Generator": "invoice",
  "Cashier Shift Reports": "cashier-shift-reports",
  "HPP Calculator": "hpp",
  "Shift Reports": "operation-reports",
  "Team Management": "team-management",
  "Shift Overview": "roster-overview",
  "Employee Performance": "employee-performance",
  "Audit Log": "audit-log",
  "Approval Center": "approvals",
  "Employee Contracts": "contracts",
  "Employee Attendance": "attendance",
  Payroll: "payroll",
  "Developer Monitoring": "platform-monitoring",
};

const rawMaterialDashboardBySurface: Partial<Record<SharedDashboardSurfaceId, RawMaterialSharedDashboardId>> = {
  "business-overview": "overview",
  sales: "sales",
  customers: "customers",
  inventory: "inventory",
  "cashier-shift-reports": "shift-reports",
  "operation-reports": "shift-reports",
  "team-management": "team-management",
  "employee-performance": "employee-performance",
  approvals: "approvals",
};

const restaurantDashboardBySurface: Partial<Record<SharedDashboardSurfaceId, RestaurantSharedDashboardId>> = {
  "business-overview": "overview",
  sales: "sales",
  customers: "customers",
  inventory: "inventory",
  cashflow: "cashflow",
  "financial-reports": "financial-reports",
  invoice: "invoice-generator",
  "cashier-shift-reports": "shift-reports",
  "operation-reports": "shift-reports",
  "team-management": "team-management",
  "roster-overview": "roster-overview",
  "employee-performance": "employee-performance",
  "audit-log": "audit-controls",
  approvals: "approvals",
  contracts: "employee-contracts",
  attendance: "employee-attendance",
  payroll: "payroll",
};

const retailDashboardBySurface: Partial<Record<SharedDashboardSurfaceId, RetailSharedDashboardId>> = {
  "business-overview": "overview",
  sales: "sales",
  customers: "customers",
  inventory: "inventory",
  "financial-reports": "financial-reports",
  invoice: "invoice-generator",
  "cashier-shift-reports": "shift-reports",
  "team-management": "team-management",
  "roster-overview": "roster-overview",
  "employee-performance": "employee-performance",
  "audit-log": "audit-controls",
  approvals: "approvals",
  contracts: "employee-contracts",
  attendance: "employee-attendance",
  payroll: "payroll",
};

function isServiceBusinessPreviewModeActive(): boolean {
  const rawMode = getRawBusinessModeStorageValue();

  return rawMode === "custom-business";
}

function renderActiveModeDashboardAdapter({
  context,
  rawMaterialDashboardId,
  restaurantDashboardId,
  retailDashboardId,
  children,
}: {
  context?: SharedDashboardModeContext;
  rawMaterialDashboardId?: RawMaterialSharedDashboardId;
  restaurantDashboardId?: RestaurantSharedDashboardId;
  retailDashboardId?: RetailSharedDashboardId;
  children: ReactNode;
}) {
  if (context?.activeMode === "raw-material" && rawMaterialDashboardId) {
    return (
      <RawMaterialSharedDashboardBridge dashboardId={rawMaterialDashboardId}>
        {children}
      </RawMaterialSharedDashboardBridge>
    );
  }

  if (context?.activeMode === "restaurant" && restaurantDashboardId) {
    return (
      <RestaurantSharedDashboardBridge dashboardId={restaurantDashboardId}>
        {children}
      </RestaurantSharedDashboardBridge>
    );
  }

  if (context?.activeMode === "retail" && retailDashboardId) {
    return (
      <RetailSharedDashboardBridge dashboardId={retailDashboardId}>
        {children}
      </RetailSharedDashboardBridge>
    );
  }

  return children;
}

function SharedDashboardModeBadge({ context }: { context?: SharedDashboardModeContext }) {
  if (!context) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
        Mode: {context.activeModeShortLabel}
      </span>
      <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600">
        Scope: {context.queryScopeKey}
      </span>
      {context.isSupported ? (
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
          {context.supportStatusLabel}
        </span>
      ) : (
        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
          {context.supportStatusLabel}
        </span>
      )}
    </div>
  );
}

export function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const serviceBusinessSurface = serviceBusinessSurfaceByTitle[title];
  const sharedDashboardModeContext = serviceBusinessSurface
    ? getSharedDashboardModeContext(serviceBusinessSurface as SharedDashboardSurfaceId)
    : undefined;
  const isServicePreview = isServiceBusinessPreviewModeActive();
  const shouldCallServiceBridge = serviceBusinessSurface
    ? isServicePreview &&
      shouldCallServiceBusinessSharedSurface(serviceBusinessSurface)
    : false;
  const shouldHideChildrenForService = Boolean(
    isServicePreview &&
      serviceBusinessSurface &&
      shouldHideSharedDashboardForServiceMode(serviceBusinessSurface),
  );
  const shouldShowModeContextUnavailable = Boolean(
    sharedDashboardModeContext?.emptyStateMessage && !isServicePreview,
  );
  const rawMaterialDashboardId = serviceBusinessSurface
    ? rawMaterialDashboardBySurface[serviceBusinessSurface as SharedDashboardSurfaceId]
    : undefined;
  const restaurantDashboardId = serviceBusinessSurface
    ? restaurantDashboardBySurface[serviceBusinessSurface as SharedDashboardSurfaceId]
    : undefined;
  const retailDashboardId = serviceBusinessSurface
    ? retailDashboardBySurface[serviceBusinessSurface as SharedDashboardSurfaceId]
    : undefined;
  const dashboardContent = shouldHideChildrenForService && serviceBusinessSurface ? (
    <ServiceBusinessSharedDashboardHiddenNotice surface={serviceBusinessSurface} />
  ) : (
    children
  );
  const bridgedDashboardContent = renderActiveModeDashboardAdapter({
    context: sharedDashboardModeContext,
    rawMaterialDashboardId,
    restaurantDashboardId,
    retailDashboardId,
    children: dashboardContent,
  });

  return (
    <section className="flex min-h-0 flex-col gap-5">
      <DashboardHeader title={title} description={description} modeContext={sharedDashboardModeContext} />
      {sharedDashboardModeContext?.emptyStateMessage ? (
        <DashboardPanel title="Mode context unavailable" description="This shared dashboard is protected by the active business mode context.">
          <p className="p-4 text-sm font-medium text-amber-700">
            {sharedDashboardModeContext.emptyStateMessage}
          </p>
        </DashboardPanel>
      ) : null}
      {serviceBusinessSurface && shouldCallServiceBridge ? (
        <ServiceBusinessSharedDashboardBridge surface={serviceBusinessSurface} />
      ) : null}
      {shouldShowModeContextUnavailable ? null : bridgedDashboardContent}
    </section>
  );
}

export function DashboardHeader({
  title,
  description,
  modeContext,
}: {
  title: string;
  description: string;
  modeContext?: SharedDashboardModeContext;
}) {
  return (
    <header className="border-b border-border pb-5">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <SharedDashboardModeBadge context={modeContext} />
    </header>
  );
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      {(title || description || action) && (
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && (
              <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
