import type { ReactNode } from "react";

import {
  ServiceBusinessSharedDashboardBridge,
  type ServiceBusinessSharedSurface,
} from "@/features/shared/service-business/service-business-shared-dashboard-bridge";
import { cn } from "@/lib/utils";

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

  return (
    <section className="flex min-h-0 flex-col gap-5">
      <DashboardHeader title={title} description={description} />
      {serviceBusinessSurface ? (
        <ServiceBusinessSharedDashboardBridge surface={serviceBusinessSurface} />
      ) : null}
      {children}
    </section>
  );
}

export function DashboardHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="border-b border-border pb-5">
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
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
