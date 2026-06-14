"use client";

import {
  AlertTriangle,
  Banknote,
  BarChart3,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  RefreshCw,
  ShieldCheck,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

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

type Metric = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: DashboardTone;
};

type SummaryItem = {
  label: string;
  value: string;
  tone: DashboardTone;
};

type DemoDashboardProps<TData> = {
  title: string;
  description: string;
  notice: string;
  metrics: Metric[];
  panelTitle: string;
  panelDescription: string;
  columns: DataTableColumn<TData>[];
  data: TData[];
  getRowKey: (row: TData) => string;
  minWidth?: number;
  sideTitle: string;
  sideDescription: string;
  sideItems: SummaryItem[];
};

const statusTone: Record<string, DashboardTone> = {
  Active: "green",
  Completed: "green",
  Approved: "green",
  Ready: "green",
  Draft: "slate",
  Pending: "amber",
  Review: "amber",
  Warning: "amber",
  Rejected: "rose",
  Overdue: "rose",
  Hold: "slate",
};

function getStatusTone(status: string): DashboardTone {
  return statusTone[status] ?? "slate";
}

function DemoNotice({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="leading-6">{children}</p>
      </div>
    </div>
  );
}

function SummaryPanel({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: SummaryItem[];
}) {
  return (
    <DashboardPanel title={title} description={description}>
      <div className="grid gap-3 p-4">
        {items.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
          >
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <StatusPill tone={item.tone}>{item.value}</StatusPill>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function DemoDashboard<TData>({
  title,
  description,
  notice,
  metrics,
  panelTitle,
  panelDescription,
  columns,
  data,
  getRowKey,
  minWidth = 960,
  sideTitle,
  sideDescription,
  sideItems,
}: DemoDashboardProps<TData>) {
  return (
    <DashboardShell title={title} description={description}>
      <DemoNotice>{notice}</DemoNotice>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            note={metric.note}
            icon={metric.icon}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <DashboardPanel
          title={panelTitle}
          description={panelDescription}
          action={
            <DashboardActions>
              <DashboardActionButton icon={RefreshCw} disabled title="Dummy dashboard belum punya backend refresh.">
                Refresh
              </DashboardActionButton>
              <DashboardActionButton icon={Download} disabled title="Export ditunda sampai data source asli tersedia.">
                Export
              </DashboardActionButton>
            </DashboardActions>
          }
        >
          <DataTable columns={columns} data={data} getRowKey={getRowKey} minWidth={minWidth} pagination={false} />
        </DashboardPanel>

        <SummaryPanel title={sideTitle} description={sideDescription} items={sideItems} />
      </div>
    </DashboardShell>
  );
}

type HppRow = {
  id: string;
  component: string;
  category: string;
  cost: number;
  note: string;
};

const hppRows: HppRow[] = [
  { id: "hpp-raw", component: "Raw Material", category: "COGS", cost: 6_850_000, note: "Bahan utama minggu berjalan" },
  { id: "hpp-packaging", component: "Packaging", category: "COGS", cost: 1_120_000, note: "Box, cup, label, plastik" },
  { id: "hpp-labor", component: "Direct Labor", category: "Direct Cost", cost: 2_400_000, note: "Jam kerja produksi langsung" },
  { id: "hpp-overhead", component: "Kitchen Overhead", category: "Overhead", cost: 1_680_000, note: "Gas, listrik, air, penyusutan kecil" },
];

const totalHpp = hppRows.reduce((total, row) => total + row.cost, 0);
const hppOutputUnits = 840;
const hppPerUnit = totalHpp / hppOutputUnits;
const suggestedPrice = hppPerUnit * 1.65;

const hppColumns: DataTableColumn<HppRow>[] = [
  { key: "component", header: "Component", cell: (row) => <span className="font-medium text-foreground">{row.component}</span> },
  { key: "category", header: "Category", cell: (row) => row.category },
  { key: "cost", header: "Cost", cell: (row) => formatCurrency(row.cost) },
  { key: "note", header: "Note", cell: (row) => row.note },
];

export function HppCalculatorDashboard() {
  return (
    <DemoDashboard
      title="HPP Calculator"
      description="Dummy cost-of-goods calculator for estimating unit cost, target margin, and selling price before a real costing engine exists."
      notice="Semua angka HPP masih hardcoded. Ini hanya layout dan planning UI, belum nyambung ke inventory, recipe, purchase, payroll, atau schema Prisma."
      metrics={[
        { label: "Total HPP", value: formatCurrency(totalHpp), note: "Raw material + labor + overhead", icon: Calculator, tone: "green" },
        { label: "Output Units", value: formatNumber(hppOutputUnits), note: "Dummy finished units", icon: ClipboardList, tone: "blue" },
        { label: "HPP / Unit", value: formatCurrency(hppPerUnit), note: "Estimated cost per product", icon: Banknote, tone: "amber" },
        { label: "Suggested Price", value: formatCurrency(suggestedPrice), note: "Target markup 65%", icon: BarChart3, tone: "slate" },
      ]}
      panelTitle="Cost Breakdown"
      panelDescription="Prepared columns for future recipe, purchase, inventory, and payroll integration."
      columns={hppColumns}
      data={hppRows}
      getRowKey={(row) => row.id}
      sideTitle="Future Data Source"
      sideDescription="Schema/API yang perlu disiapkan nanti, bukan sekarang."
      sideItems={[
        { label: "Recipe cost link", value: "Planned", tone: "amber" },
        { label: "Purchase price history", value: "Planned", tone: "amber" },
        { label: "Direct labor allocation", value: "Draft", tone: "slate" },
        { label: "Margin simulation", value: "Ready UI", tone: "green" },
      ]}
    />
  );
}

type ShiftReportRow = {
  id: string;
  shift: string;
  scope: string;
  pic: string;
  revenue: number;
  variance: number;
  status: string;
};

const shiftReportRows: ShiftReportRow[] = [
  { id: "sr-001", shift: "Morning Shift", scope: "Restaurant", pic: "Nadia", revenue: 12_450_000, variance: 0, status: "Completed" },
  { id: "sr-002", shift: "Afternoon Shift", scope: "Restaurant", pic: "Raka", revenue: 18_900_000, variance: -85_000, status: "Review" },
  { id: "sr-003", shift: "Warehouse Intake", scope: "Raw Material", pic: "Dimas", revenue: 0, variance: 120_000, status: "Pending" },
];

const shiftReportColumns: DataTableColumn<ShiftReportRow>[] = [
  { key: "shift", header: "Shift", cell: (row) => <span className="font-medium text-foreground">{row.shift}</span> },
  { key: "scope", header: "Business Scope", cell: (row) => row.scope },
  { key: "pic", header: "PIC", cell: (row) => row.pic },
  { key: "revenue", header: "Revenue", cell: (row) => (row.revenue > 0 ? formatCurrency(row.revenue) : "-") },
  { key: "variance", header: "Variance", cell: (row) => formatCurrency(row.variance) },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={getStatusTone(row.status)}>{row.status}</StatusPill> },
];

export function ShiftReportsDashboard() {
  const totalRevenue = shiftReportRows.reduce((total, row) => total + row.revenue, 0);
  const totalVariance = shiftReportRows.reduce((total, row) => total + row.variance, 0);

  return (
    <DemoDashboard
      title="Shift Reports"
      description="Hardcoded shared shift reporting screen for operations, finance review, and cross-mode closing summaries."
      notice="Laporan shift ini dummy. Existing cashier shift API tetap tidak diubah, dan dashboard ini tidak menulis data ke cashflow."
      metrics={[
        { label: "Shift Revenue", value: formatCurrency(totalRevenue), note: "Dummy total from visible rows", icon: Banknote, tone: "green" },
        { label: "Net Variance", value: formatCurrency(totalVariance), note: "Cash over/short mock", icon: AlertTriangle, tone: "amber" },
        { label: "Closed Shifts", value: "1/3", note: "Completed report sample", icon: CheckCircle2, tone: "blue" },
        { label: "Needs Review", value: "2", note: "Pending finance check", icon: ClipboardList, tone: "rose" },
      ]}
      panelTitle="Shift Closing Summary"
      panelDescription="Prepared for cashier, warehouse, and service shift summaries later."
      columns={shiftReportColumns}
      data={shiftReportRows}
      getRowKey={(row) => row.id}
      sideTitle="Closing Checklist"
      sideDescription="Operations checks before finance locks the day."
      sideItems={[
        { label: "Cash reconciliation", value: "Review", tone: "amber" },
        { label: "Cashflow sync", value: "Draft", tone: "slate" },
        { label: "Supervisor sign-off", value: "Pending", tone: "amber" },
        { label: "PDF closing report", value: "Planned", tone: "slate" },
      ]}
    />
  );
}

type TeamRow = {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
  workload: string;
};

const teamRows: TeamRow[] = [
  { id: "tm-001", name: "Nadia Putri", role: "Cashier Lead", department: "Front Office", status: "Active", workload: "36h / week" },
  { id: "tm-002", name: "Raka Pratama", role: "Server", department: "Service", status: "Active", workload: "32h / week" },
  { id: "tm-003", name: "Dimas Arga", role: "Inventory Staff", department: "Warehouse", status: "Pending", workload: "Onboarding" },
  { id: "tm-004", name: "Maya Sari", role: "Finance Admin", department: "Back Office", status: "Active", workload: "40h / week" },
];

const teamColumns: DataTableColumn<TeamRow>[] = [
  { key: "name", header: "Name", cell: (row) => <span className="font-medium text-foreground">{row.name}</span> },
  { key: "role", header: "Role", cell: (row) => row.role },
  { key: "department", header: "Department", cell: (row) => row.department },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={getStatusTone(row.status)}>{row.status}</StatusPill> },
  { key: "workload", header: "Workload", cell: (row) => row.workload },
];

export function TeamManagementDashboard() {
  return (
    <DemoDashboard
      title="Team Management"
      description="Shared employee and role management dashboard for owner/manager visibility across business modes."
      notice="Data team masih dummy. Belum ada employee schema baru, kontrak, payroll, atau attendance relation yang ditulis ke database."
      metrics={[
        { label: "Active Employees", value: "3", note: "From dummy team list", icon: Users, tone: "green" },
        { label: "Departments", value: "4", note: "FOH, Service, Warehouse, Finance", icon: ClipboardList, tone: "blue" },
        { label: "Pending Onboarding", value: "1", note: "Need account and contract", icon: Clock3, tone: "amber" },
        { label: "Role Coverage", value: "82%", note: "Dummy schedule coverage", icon: BarChart3, tone: "slate" },
      ]}
      panelTitle="Team Directory"
      panelDescription="Prepared for employee profiles, roles, access, and department assignment."
      columns={teamColumns}
      data={teamRows}
      getRowKey={(row) => row.id}
      sideTitle="Setup Readiness"
      sideDescription="Workforce modules that can be wired after schema planning."
      sideItems={[
        { label: "Role and permission mapping", value: "Ready UI", tone: "green" },
        { label: "Employee profile schema", value: "Planned", tone: "amber" },
        { label: "Invite employee flow", value: "Draft", tone: "slate" },
        { label: "Department management", value: "Planned", tone: "amber" },
      ]}
    />
  );
}

type ShiftOverviewRow = {
  id: string;
  day: string;
  coverage: string;
  employees: number;
  openSlots: number;
  risk: string;
};

const shiftOverviewRows: ShiftOverviewRow[] = [
  { id: "so-mon", day: "Monday", coverage: "Morning + Afternoon", employees: 8, openSlots: 1, risk: "Warning" },
  { id: "so-tue", day: "Tuesday", coverage: "Morning + Afternoon", employees: 9, openSlots: 0, risk: "Ready" },
  { id: "so-wed", day: "Wednesday", coverage: "Morning + Night", employees: 7, openSlots: 2, risk: "Review" },
];

const shiftOverviewColumns: DataTableColumn<ShiftOverviewRow>[] = [
  { key: "day", header: "Day", cell: (row) => <span className="font-medium text-foreground">{row.day}</span> },
  { key: "coverage", header: "Coverage", cell: (row) => row.coverage },
  { key: "employees", header: "Employees", cell: (row) => formatNumber(row.employees) },
  { key: "openSlots", header: "Open Slots", cell: (row) => formatNumber(row.openSlots) },
  { key: "risk", header: "Risk", cell: (row) => <StatusPill tone={getStatusTone(row.risk)}>{row.risk}</StatusPill> },
];

export function ShiftOverviewDashboard() {
  const openSlots = shiftOverviewRows.reduce((total, row) => total + row.openSlots, 0);

  return (
    <DemoDashboard
      title="Shift Overview"
      description="Dummy weekly shift coverage dashboard for scheduling visibility before a real roster module is built."
      notice="Shift overview ini belum scheduler asli. Belum ada recurring shifts, attendance lock, atau employee availability table."
      metrics={[
        { label: "Scheduled Employees", value: "24", note: "Sum of dummy coverage rows", icon: Users, tone: "green" },
        { label: "Open Slots", value: formatNumber(openSlots), note: "Need manager assignment", icon: Clock3, tone: "amber" },
        { label: "Coverage Rate", value: "88%", note: "Dummy weekly coverage", icon: BarChart3, tone: "blue" },
        { label: "Risk Days", value: "2", note: "Warning or review status", icon: AlertTriangle, tone: "rose" },
      ]}
      panelTitle="Weekly Coverage Preview"
      panelDescription="Prepared for roster, leave requests, and department coverage later."
      columns={shiftOverviewColumns}
      data={shiftOverviewRows}
      getRowKey={(row) => row.id}
      sideTitle="Future Scheduling Rules"
      sideDescription="Business rules to add after foundation is stable."
      sideItems={[
        { label: "Max weekly hours", value: "Planned", tone: "amber" },
        { label: "Leave conflict check", value: "Draft", tone: "slate" },
        { label: "Auto assignment", value: "Not now", tone: "slate" },
        { label: "Manager approval", value: "Planned", tone: "amber" },
      ]}
    />
  );
}

type PerformanceRow = {
  id: string;
  employee: string;
  role: string;
  score: number;
  metric: string;
  status: string;
};

const performanceRows: PerformanceRow[] = [
  { id: "pf-001", employee: "Nadia Putri", role: "Cashier Lead", score: 94, metric: "Cash variance 0%, high throughput", status: "Ready" },
  { id: "pf-002", employee: "Raka Pratama", role: "Server", score: 87, metric: "Fast table turnover", status: "Active" },
  { id: "pf-003", employee: "Dimas Arga", role: "Inventory Staff", score: 72, metric: "Stock correction needs review", status: "Review" },
];

const performanceColumns: DataTableColumn<PerformanceRow>[] = [
  { key: "employee", header: "Employee", cell: (row) => <span className="font-medium text-foreground">{row.employee}</span> },
  { key: "role", header: "Role", cell: (row) => row.role },
  { key: "score", header: "Score", cell: (row) => `${row.score}/100` },
  { key: "metric", header: "Metric", cell: (row) => row.metric },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={getStatusTone(row.status)}>{row.status}</StatusPill> },
];

export function EmployeePerformanceDashboard() {
  const averageScore = Math.round(performanceRows.reduce((total, row) => total + row.score, 0) / performanceRows.length);

  return (
    <DemoDashboard
      title="Employee Performance"
      description="Shared workforce performance dashboard for comparing employee output, quality, and operational consistency."
      notice="Performance karyawan masih dummy. Jangan dijadikan evaluasi manusia beneran, karena menilai orang pakai angka asal adalah tradisi buruk yang tidak perlu dibantu komputer."
      metrics={[
        { label: "Average Score", value: `${averageScore}/100`, note: "Dummy weighted score", icon: BarChart3, tone: "green" },
        { label: "Top Performer", value: "Nadia", note: "Highest dummy score", icon: CheckCircle2, tone: "blue" },
        { label: "Needs Coaching", value: "1", note: "Review status", icon: ClipboardList, tone: "amber" },
        { label: "Tracked Roles", value: "3", note: "Cashier, server, warehouse", icon: Users, tone: "slate" },
      ]}
      panelTitle="Performance Scorecard"
      panelDescription="Prepared for KPI formulas, task completion, attendance, and shift accuracy later."
      columns={performanceColumns}
      data={performanceRows}
      getRowKey={(row) => row.id}
      sideTitle="KPI Formula Plan"
      sideDescription="Candidate scoring components for future backend rules."
      sideItems={[
        { label: "Attendance reliability", value: "25%", tone: "blue" },
        { label: "Cash/stock accuracy", value: "30%", tone: "green" },
        { label: "Task completion", value: "25%", tone: "amber" },
        { label: "Manager review", value: "20%", tone: "slate" },
      ]}
    />
  );
}

type AuditRow = {
  id: string;
  event: string;
  actor: string;
  module: string;
  time: string;
  severity: string;
};

const auditRows: AuditRow[] = [
  { id: "au-001", event: "Updated menu price", actor: "Owner", module: "Menu", time: "Today 09:12", severity: "Active" },
  { id: "au-002", event: "Payroll draft exported", actor: "Finance", module: "Payroll", time: "Today 11:40", severity: "Review" },
  { id: "au-003", event: "Changed inventory correction", actor: "Manager", module: "Inventory", time: "Yesterday 20:05", severity: "Warning" },
];

const auditColumns: DataTableColumn<AuditRow>[] = [
  { key: "event", header: "Event", cell: (row) => <span className="font-medium text-foreground">{row.event}</span> },
  { key: "actor", header: "Actor", cell: (row) => row.actor },
  { key: "module", header: "Module", cell: (row) => row.module },
  { key: "time", header: "Time", cell: (row) => row.time },
  { key: "severity", header: "Severity", cell: (row) => <StatusPill tone={getStatusTone(row.severity)}>{row.severity}</StatusPill> },
];

export function AuditLogDashboard() {
  return (
    <DemoDashboard
      title="Audit Log"
      description="Dummy audit trail dashboard for tracking important actions across shared business modules."
      notice="Audit log ini display dummy. Belum ada append-only audit table, actor metadata, IP/device metadata, atau retention policy."
      metrics={[
        { label: "Events Today", value: "18", note: "Mock audit events", icon: ShieldCheck, tone: "blue" },
        { label: "High Risk", value: "1", note: "Inventory correction review", icon: AlertTriangle, tone: "rose" },
        { label: "Modules Tracked", value: "6", note: "Menu, payroll, inventory, etc", icon: ClipboardList, tone: "green" },
        { label: "Retention", value: "Planned", note: "Future audit policy", icon: FileText, tone: "slate" },
      ]}
      panelTitle="Recent Audit Events"
      panelDescription="Prepared for immutable audit history after schema and backend are ready."
      columns={auditColumns}
      data={auditRows}
      getRowKey={(row) => row.id}
      sideTitle="Audit Engine Plan"
      sideDescription="Rules to protect business-critical history later."
      sideItems={[
        { label: "Append-only writes", value: "Planned", tone: "amber" },
        { label: "Actor and role snapshot", value: "Planned", tone: "amber" },
        { label: "Before/after diff", value: "Draft", tone: "slate" },
        { label: "Export log", value: "Ready UI", tone: "green" },
      ]}
    />
  );
}

type ApprovalRow = {
  id: string;
  request: string;
  requester: string;
  amount: number;
  approver: string;
  status: string;
};

const approvalRows: ApprovalRow[] = [
  { id: "ap-001", request: "Stock purchase above limit", requester: "Inventory", amount: 8_400_000, approver: "Owner", status: "Pending" },
  { id: "ap-002", request: "Payroll adjustment", requester: "Finance", amount: 650_000, approver: "Manager", status: "Review" },
  { id: "ap-003", request: "Supplier contract renewal", requester: "Ops", amount: 0, approver: "Owner", status: "Approved" },
];

const approvalColumns: DataTableColumn<ApprovalRow>[] = [
  { key: "request", header: "Request", cell: (row) => <span className="font-medium text-foreground">{row.request}</span> },
  { key: "requester", header: "Requester", cell: (row) => row.requester },
  { key: "amount", header: "Amount", cell: (row) => (row.amount > 0 ? formatCurrency(row.amount) : "-") },
  { key: "approver", header: "Approver", cell: (row) => row.approver },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={getStatusTone(row.status)}>{row.status}</StatusPill> },
];

export function ApprovalDashboard() {
  return (
    <DemoDashboard
      title="Approval Center"
      description="Dummy approval dashboard for purchase, payroll, contract, and operational exception workflows."
      notice="Approval center ini belum workflow engine. Tidak ada approve/reject mutation, notification, atau permission enforcement baru."
      metrics={[
        { label: "Pending Requests", value: "2", note: "Waiting approval", icon: Clock3, tone: "amber" },
        { label: "Approved Today", value: "1", note: "Dummy approval", icon: CheckCircle2, tone: "green" },
        { label: "Approval Value", value: formatCurrency(9_050_000), note: "Requests with amount", icon: Banknote, tone: "blue" },
        { label: "SLA Risk", value: "1", note: "Needs owner review", icon: AlertTriangle, tone: "rose" },
      ]}
      panelTitle="Approval Queue"
      panelDescription="Prepared for approval policy, delegation, and audit trail later."
      columns={approvalColumns}
      data={approvalRows}
      getRowKey={(row) => row.id}
      sideTitle="Approval Rules Draft"
      sideDescription="Policy ideas to wire after permissions are stable."
      sideItems={[
        { label: "Purchase > threshold", value: "Owner", tone: "blue" },
        { label: "Payroll correction", value: "Manager", tone: "amber" },
        { label: "Contract renewal", value: "Owner", tone: "green" },
        { label: "Auto approval", value: "Not now", tone: "slate" },
      ]}
    />
  );
}

type ContractRow = {
  id: string;
  employee: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
};

const contractRows: ContractRow[] = [
  { id: "ct-001", employee: "Nadia Putri", type: "Full-time", startDate: "2026-01-01", endDate: "2026-12-31", status: "Active" },
  { id: "ct-002", employee: "Raka Pratama", type: "Part-time", startDate: "2026-03-01", endDate: "2026-08-31", status: "Review" },
  { id: "ct-003", employee: "Dimas Arga", type: "Probation", startDate: "2026-06-01", endDate: "2026-08-31", status: "Pending" },
];

const contractColumns: DataTableColumn<ContractRow>[] = [
  { key: "employee", header: "Employee", cell: (row) => <span className="font-medium text-foreground">{row.employee}</span> },
  { key: "type", header: "Type", cell: (row) => row.type },
  { key: "startDate", header: "Start", cell: (row) => row.startDate },
  { key: "endDate", header: "End", cell: (row) => row.endDate },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={getStatusTone(row.status)}>{row.status}</StatusPill> },
];

export function EmployeeContractsDashboard() {
  return (
    <DemoDashboard
      title="Employee Contracts"
      description="Dummy employee contract dashboard for employment type, contract validity, and document readiness."
      notice="Kontrak karyawan masih dummy. Belum upload file, belum e-signature, belum relation ke employee profile."
      metrics={[
        { label: "Active Contracts", value: "1", note: "Current valid contracts", icon: FileText, tone: "green" },
        { label: "Needs Review", value: "1", note: "Expiring or incomplete", icon: AlertTriangle, tone: "amber" },
        { label: "Pending Sign", value: "1", note: "Dummy onboarding", icon: Clock3, tone: "rose" },
        { label: "Contract Types", value: "3", note: "Full-time, part-time, probation", icon: ClipboardList, tone: "blue" },
      ]}
      panelTitle="Contract Register"
      panelDescription="Prepared for document metadata, employment terms, and renewal alerts later."
      columns={contractColumns}
      data={contractRows}
      getRowKey={(row) => row.id}
      sideTitle="Contract Data Plan"
      sideDescription="Candidate fields for future schema."
      sideItems={[
        { label: "Document URL", value: "Planned", tone: "amber" },
        { label: "Salary term link", value: "Draft", tone: "slate" },
        { label: "Renewal reminder", value: "Planned", tone: "amber" },
        { label: "Approval trail", value: "Needed", tone: "rose" },
      ]}
    />
  );
}

type AttendanceRow = {
  id: string;
  employee: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
};

const attendanceRows: AttendanceRow[] = [
  { id: "at-001", employee: "Nadia Putri", date: "2026-06-13", checkIn: "08:01", checkOut: "16:05", status: "Completed" },
  { id: "at-002", employee: "Raka Pratama", date: "2026-06-13", checkIn: "10:10", checkOut: "-", status: "Active" },
  { id: "at-003", employee: "Dimas Arga", date: "2026-06-13", checkIn: "-", checkOut: "-", status: "Pending" },
];

const attendanceColumns: DataTableColumn<AttendanceRow>[] = [
  { key: "employee", header: "Employee", cell: (row) => <span className="font-medium text-foreground">{row.employee}</span> },
  { key: "date", header: "Date", cell: (row) => row.date },
  { key: "checkIn", header: "Check In", cell: (row) => row.checkIn },
  { key: "checkOut", header: "Check Out", cell: (row) => row.checkOut },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={getStatusTone(row.status)}>{row.status}</StatusPill> },
];

export function EmployeeAttendanceDashboard() {
  return (
    <DemoDashboard
      title="Employee Attendance"
      description="Dummy attendance dashboard for check-in, check-out, late arrival, and daily workforce visibility."
      notice="Absensi ini belum real-time dan belum pakai device/location. Jangan update schema dulu, cukup siapkan UI dan data contract."
      metrics={[
        { label: "Present Today", value: "2", note: "Checked in dummy rows", icon: Users, tone: "green" },
        { label: "Active Shift", value: "1", note: "Not checked out yet", icon: Clock3, tone: "blue" },
        { label: "Missing Check-in", value: "1", note: "Needs supervisor check", icon: AlertTriangle, tone: "amber" },
        { label: "Attendance Rate", value: "67%", note: "Dummy today rate", icon: BarChart3, tone: "slate" },
      ]}
      panelTitle="Today Attendance"
      panelDescription="Prepared for attendance records, shift matching, and payroll calculation later."
      columns={attendanceColumns}
      data={attendanceRows}
      getRowKey={(row) => row.id}
      sideTitle="Attendance Integration Plan"
      sideDescription="Where attendance should connect after schema exists."
      sideItems={[
        { label: "Shift matching", value: "Planned", tone: "amber" },
        { label: "Late deduction", value: "Draft", tone: "slate" },
        { label: "Payroll input", value: "Planned", tone: "amber" },
        { label: "Manual correction approval", value: "Needed", tone: "rose" },
      ]}
    />
  );
}

type PayrollRow = {
  id: string;
  employee: string;
  basePay: number;
  allowance: number;
  deduction: number;
  status: string;
};

const payrollRows: PayrollRow[] = [
  { id: "py-001", employee: "Nadia Putri", basePay: 4_200_000, allowance: 450_000, deduction: 0, status: "Ready" },
  { id: "py-002", employee: "Raka Pratama", basePay: 2_800_000, allowance: 250_000, deduction: 50_000, status: "Review" },
  { id: "py-003", employee: "Dimas Arga", basePay: 1_900_000, allowance: 150_000, deduction: 0, status: "Pending" },
];

const payrollColumns: DataTableColumn<PayrollRow>[] = [
  { key: "employee", header: "Employee", cell: (row) => <span className="font-medium text-foreground">{row.employee}</span> },
  { key: "basePay", header: "Base Pay", cell: (row) => formatCurrency(row.basePay) },
  { key: "allowance", header: "Allowance", cell: (row) => formatCurrency(row.allowance) },
  { key: "deduction", header: "Deduction", cell: (row) => formatCurrency(row.deduction) },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={getStatusTone(row.status)}>{row.status}</StatusPill> },
];

export function PayrollDashboard() {
  const grossPay = payrollRows.reduce((total, row) => total + row.basePay + row.allowance, 0);
  const deductions = payrollRows.reduce((total, row) => total + row.deduction, 0);
  const netPay = grossPay - deductions;

  return (
    <DemoDashboard
      title="Payroll"
      description="Dummy payroll dashboard for salary preview, allowances, deductions, and approval readiness."
      notice="Payroll ini belum payroll engine. Tidak ada tax, BPJS, transfer bank, payslip, atau financial journal yang dibuat. Semua angka masih contoh."
      metrics={[
        { label: "Gross Payroll", value: formatCurrency(grossPay), note: "Base pay + allowance", icon: WalletCards, tone: "green" },
        { label: "Deductions", value: formatCurrency(deductions), note: "Dummy deduction", icon: AlertTriangle, tone: "amber" },
        { label: "Net Payroll", value: formatCurrency(netPay), note: "Estimated payout", icon: Banknote, tone: "blue" },
        { label: "Ready Payslips", value: "1/3", note: "Dummy status", icon: FileText, tone: "slate" },
      ]}
      panelTitle="Payroll Preview"
      panelDescription="Prepared for attendance, contract salary, approval, and cashflow journal integration later."
      columns={payrollColumns}
      data={payrollRows}
      getRowKey={(row) => row.id}
      sideTitle="Payroll Flow Draft"
      sideDescription="Execution steps before payout becomes real."
      sideItems={[
        { label: "Attendance lock", value: "Needed", tone: "rose" },
        { label: "Manager approval", value: "Planned", tone: "amber" },
        { label: "Payslip generate", value: "Draft", tone: "slate" },
        { label: "Cashflow journal", value: "Planned", tone: "amber" },
      ]}
    />
  );
}
