"use client";

import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Clock3,
  Download,
  FileText,
  Handshake,
  Package,
  ReceiptText,
  RefreshCw,
  WalletCards,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { StatCard, StatusPill } from "@/features/shared/cards";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
  DashboardShell,
} from "@/features/shared/dashboard";
import { formatCurrency, formatNumber } from "@/features/shared/format";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

type ModeStatus = "Live" | "Preview" | "Planned";
type QueueItemStatus = "Ready" | "In Progress" | "Needs Review" | "Waiting";

type ModeSnapshot = {
  id: string;
  name: string;
  status: ModeStatus;
  summary: string;
  revenue: number;
  activeWork: number;
  alertCount: number;
};

type SharedModule = {
  id: string;
  name: string;
  description: string;
  route: string;
  owner: string;
  readiness: string;
  tone: DashboardTone;
};

type QueueItem = {
  id: string;
  sourceMode: string;
  title: string;
  owner: string;
  amount: number;
  status: QueueItemStatus;
  eta: string;
};

const modeStatusTone: Record<ModeStatus, DashboardTone> = {
  Live: "green",
  Preview: "amber",
  Planned: "slate",
};

const queueStatusTone: Record<QueueItemStatus, DashboardTone> = {
  Ready: "green",
  "In Progress": "blue",
  "Needs Review": "amber",
  Waiting: "slate",
};

const modeSnapshots: ModeSnapshot[] = [
  {
    id: "restaurant",
    name: "Restaurant",
    status: "Live",
    summary: "POS, kitchen, serving, table, menu, payment, and operational reports.",
    revenue: 128_450_000,
    activeWork: 184,
    alertCount: 7,
  },
  {
    id: "raw-material",
    name: "Raw Material / Livestock",
    status: "Preview",
    summary: "Intake, weighing, batches, storage, processing, kandang, and supplier flow.",
    revenue: 74_250_000,
    activeWork: 42,
    alertCount: 11,
  },
  {
    id: "retail",
    name: "Retail / Supermarket",
    status: "Planned",
    summary: "Barcode checkout, stock opname, receiving, shelf management, and promotions.",
    revenue: 0,
    activeWork: 0,
    alertCount: 3,
  },
  {
    id: "custom-business",
    name: "Service / Custom Business",
    status: "Planned",
    summary: "Requests, jobs, clients, assignments, invoices, payments, and service reports.",
    revenue: 0,
    activeWork: 0,
    alertCount: 4,
  },
];

const sharedModules: SharedModule[] = [
  {
    id: "sales",
    name: "Sales Analytics",
    description: "Revenue, order trend, product performance, and profit visibility.",
    route: ROUTES.ANALYTICS,
    owner: "Analytics",
    readiness: "Backend-backed",
    tone: "green",
  },
  {
    id: "customers",
    name: "Customers & Partners",
    description: "Reusable customer, partner, and contact workspace for every mode.",
    route: ROUTES.CUSTOMERS,
    owner: "CRM",
    readiness: "Dummy-ready",
    tone: "blue",
  },
  {
    id: "inventory",
    name: "Inventory Management",
    description: "Stock level, movement, reorder warning, and inventory health overview.",
    route: ROUTES.INVENTORY,
    owner: "Operations",
    readiness: "Mixed data",
    tone: "amber",
  },
  {
    id: "cashflow",
    name: "Cashflow",
    description: "Income, expense, daily cash movement, and period comparison.",
    route: ROUTES.CASHFLOW,
    owner: "Finance",
    readiness: "Hardcoded demo",
    tone: "green",
  },
  {
    id: "reports",
    name: "Financial Reports",
    description: "P&L summary, gross margin, expense ratio, and printable report view.",
    route: ROUTES.FINANCIAL_REPORTS,
    owner: "Finance",
    readiness: "Hardcoded demo",
    tone: "slate",
  },
  {
    id: "invoice",
    name: "Invoice Generator",
    description: "Business identity, customer data, invoice line items, and preview.",
    route: ROUTES.INVOICE_GENERATOR,
    owner: "Billing",
    readiness: "Hardcoded demo",
    tone: "blue",
  },
  {
    id: "cashier-shifts",
    name: "Cashier Shift Reports",
    description: "Cashier performance, expected cash, variance, and shift sync summary.",
    route: ROUTES.CASHIER_SHIFT_REPORTS,
    owner: "Cashier Ops",
    readiness: "Restaurant/Retail",
    tone: "amber",
  },
  {
    id: "hpp",
    name: "HPP Calculator",
    description: "Cost breakdown, unit cost, target markup, and selling price simulation.",
    route: ROUTES.HPP_CALCULATOR,
    owner: "Finance Ops",
    readiness: "Hardcoded demo",
    tone: "green",
  },
  {
    id: "operation-reports",
    name: "Shift Reports",
    description: "Shared operational closing summary for shift revenue, variance, and review.",
    route: ROUTES.OPERATION_REPORTS,
    owner: "Operations",
    readiness: "Hardcoded demo",
    tone: "amber",
  },
  {
    id: "team-management",
    name: "Team Management",
    description: "Employee directory, department, role, workload, and onboarding status.",
    route: ROUTES.TEAM_MANAGEMENT,
    owner: "HR Ops",
    readiness: "Hardcoded demo",
    tone: "blue",
  },
  {
    id: "roster-overview",
    name: "Shift Overview",
    description: "Weekly workforce coverage, open slots, and schedule risk preview.",
    route: ROUTES.ROSTER_OVERVIEW,
    owner: "HR Ops",
    readiness: "Hardcoded demo",
    tone: "slate",
  },
  {
    id: "employee-performance",
    name: "Employee Performance",
    description: "Performance scorecard, role output, coaching alerts, and KPI planning.",
    route: ROUTES.EMPLOYEE_PERFORMANCE,
    owner: "HR Ops",
    readiness: "Hardcoded demo",
    tone: "green",
  },
  {
    id: "audit-log",
    name: "Audit Log",
    description: "Important system events, actor tracking, severity, and future audit trail.",
    route: ROUTES.AUDIT_LOG,
    owner: "Control",
    readiness: "Hardcoded demo",
    tone: "slate",
  },
  {
    id: "approvals",
    name: "Approval Center",
    description: "Purchase, payroll, contract, and operation exception approval queue.",
    route: ROUTES.APPROVALS,
    owner: "Management",
    readiness: "Hardcoded demo",
    tone: "amber",
  },
  {
    id: "contracts",
    name: "Employee Contracts",
    description: "Contract type, validity, renewal alert, and document readiness preview.",
    route: ROUTES.EMPLOYEE_CONTRACTS,
    owner: "HR Ops",
    readiness: "Hardcoded demo",
    tone: "blue",
  },
  {
    id: "attendance",
    name: "Employee Attendance",
    description: "Check-in, check-out, missing attendance, and shift attendance overview.",
    route: ROUTES.EMPLOYEE_ATTENDANCE,
    owner: "HR Ops",
    readiness: "Hardcoded demo",
    tone: "green",
  },
  {
    id: "payroll",
    name: "Payroll",
    description: "Salary preview, allowance, deduction, approval readiness, and payout draft.",
    route: ROUTES.PAYROLL,
    owner: "Finance HR",
    readiness: "Hardcoded demo",
    tone: "amber",
  },
];

const operationQueue: QueueItem[] = [
  {
    id: "Q-1001",
    sourceMode: "Restaurant",
    title: "Daily closing reconciliation",
    owner: "Finance",
    amount: 18_750_000,
    status: "Needs Review",
    eta: "Today, 21:30",
  },
  {
    id: "Q-1002",
    sourceMode: "Restaurant",
    title: "Kitchen stock threshold alert",
    owner: "Inventory",
    amount: 3_450_000,
    status: "In Progress",
    eta: "Today, 18:00",
  },
  {
    id: "Q-1003",
    sourceMode: "Raw Material / Livestock",
    title: "Batch intake cost validation",
    owner: "Operations",
    amount: 22_900_000,
    status: "Ready",
    eta: "Tomorrow, 09:00",
  },
  {
    id: "Q-1004",
    sourceMode: "Shared Workforce",
    title: "Payroll draft approval",
    owner: "Finance HR",
    amount: 13_700_000,
    status: "Needs Review",
    eta: "Today, 17:00",
  },
  {
    id: "Q-1005",
    sourceMode: "Service / Custom Business",
    title: "Client invoice workflow draft",
    owner: "Billing",
    amount: 0,
    status: "Waiting",
    eta: "Design phase",
  },
];

const queueColumns: DataTableColumn<QueueItem>[] = [
  {
    key: "id",
    header: "Queue ID",
    cell: (row) => <span className="font-semibold text-foreground">{row.id}</span>,
  },
  { key: "sourceMode", header: "Mode", cell: (row) => row.sourceMode },
  {
    key: "title",
    header: "Work Item",
    cell: (row) => <span className="font-medium text-foreground">{row.title}</span>,
  },
  { key: "owner", header: "Owner", cell: (row) => row.owner },
  {
    key: "amount",
    header: "Amount",
    cell: (row) => (row.amount > 0 ? formatCurrency(row.amount) : "-"),
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => <StatusPill tone={queueStatusTone[row.status]}>{row.status}</StatusPill>,
  },
  { key: "eta", header: "ETA", cell: (row) => row.eta },
];

function ModuleLinkCard({ module }: { module: SharedModule }) {
  return (
    <a
      href={module.route}
      className="group rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm transition hover:border-primary/40 hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary">
            {module.name}
          </h3>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {module.description}
          </p>
        </div>
        <StatusPill tone={module.tone}>{module.readiness}</StatusPill>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Owner: {module.owner}
      </p>
    </a>
  );
}

function ModeSnapshotCard({ snapshot }: { snapshot: ModeSnapshot }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">{snapshot.name}</h3>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {snapshot.summary}
          </p>
        </div>
        <StatusPill tone={modeStatusTone[snapshot.status]}>{snapshot.status}</StatusPill>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="mt-1 font-semibold text-foreground">
            {snapshot.revenue > 0 ? formatCurrency(snapshot.revenue) : "-"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Work</p>
          <p className="mt-1 font-semibold text-foreground">
            {formatNumber(snapshot.activeWork)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Alerts</p>
          <p className="mt-1 font-semibold text-foreground">
            {formatNumber(snapshot.alertCount)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function BusinessOverviewDashboard() {
  const activeRevenue = modeSnapshots.reduce((total, item) => total + item.revenue, 0);
  const totalWork = modeSnapshots.reduce((total, item) => total + item.activeWork, 0);
  const totalAlerts = modeSnapshots.reduce((total, item) => total + item.alertCount, 0);
  const liveModes = modeSnapshots.filter((item) => item.status !== "Planned").length;

  return (
    <DashboardShell
      title="Shared Business Dashboard"
      description="Hardcoded cross-mode overview for demoing shared business, workforce, finance, audit, and operations modules before every mode has real backend data."
    >
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Demo-only shared dashboard</p>
            <p className="mt-1 leading-6">
              Semua angka di halaman ini masih hardcoded. Dashboard ini dibuat sebagai
              presentation layer lintas mode, bukan sumber data produksi, bukan schema baru,
              dan bukan pengganti business mode service.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Combined Revenue" value={formatCurrency(activeRevenue)} note="Restaurant + raw material dummy snapshot" icon={Banknote} tone="green" />
        <StatCard label="Active Work Items" value={formatNumber(totalWork)} note="Orders, batches, tasks, and draft workflows" icon={Clock3} tone="blue" />
        <StatCard label="Shared Modules" value={formatNumber(sharedModules.length)} note="Reusable dashboards across business modes" icon={BarChart3} tone="slate" />
        <StatCard label="Mode Coverage" value={`${liveModes}/${modeSnapshots.length}`} note="Live or preview business modes" icon={Package} tone="amber" />
        <StatCard label="Open Alerts" value={formatNumber(totalAlerts)} note="Dummy warnings across all modes" icon={AlertTriangle} tone="rose" />
      </div>

      <DashboardPanel
        title="Mode Snapshot"
        description="High-level hardcoded status for each business mode without changing the mode selector service."
      >
        <div className="grid gap-4 p-4 lg:grid-cols-2">
          {modeSnapshots.map((snapshot) => (
            <ModeSnapshotCard key={snapshot.id} snapshot={snapshot} />
          ))}
        </div>
      </DashboardPanel>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel
          title="Shared Modules"
          description="Entry points for reusable dashboards that can work across restaurant, retail, raw material, and service modes."
          action={
            <DashboardActions>
              <DashboardActionButton icon={RefreshCw} disabled title="Hardcoded dashboard has no backend refresh yet.">
                Refresh
              </DashboardActionButton>
              <DashboardActionButton icon={Download} disabled title="Export is deferred until this overview has a backend source.">
                Export
              </DashboardActionButton>
            </DashboardActions>
          }
        >
          <div className="grid gap-3 p-4 md:grid-cols-2">
            {sharedModules.map((module) => (
              <ModuleLinkCard key={module.id} module={module} />
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Shared Finance Snapshot" description="Dummy finance summary used for layout, KPI, workforce cost, and future API planning.">
          <div className="grid gap-3 p-4">
            <StatCard label="Cash Available" value={formatCurrency(37_950_000)} note="Cash + bank balance mock" icon={WalletCards} tone="green" />
            <StatCard label="Pending Invoices" value={formatCurrency(16_500_000)} note="18 unpaid customer invoices" icon={ReceiptText} tone="amber" />
            <StatCard label="Open Partners" value={formatNumber(126)} note="Customers, suppliers, and service clients" icon={Handshake} tone="blue" />
            <StatCard label="Reports Ready" value={formatNumber(17)} note="Finance, workforce, audit, approval, and operation views" icon={FileText} tone="slate" />
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Cross-Mode Operation Queue"
        description="Mock queue data to preview how shared operations may look after restaurant, raw material, retail, service, and workforce modules are wired to real APIs."
      >
        <DataTable columns={queueColumns} data={operationQueue} getRowKey={(row) => row.id} minWidth={1040} pagination={false} />
      </DashboardPanel>
    </DashboardShell>
  );
}
