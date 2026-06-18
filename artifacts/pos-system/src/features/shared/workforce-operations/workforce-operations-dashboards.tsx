"use client";

import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Hash,
  RefreshCw,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel, DashboardShell } from "@/features/shared/dashboard";
import { formatCurrency } from "@/features/shared/format";
import type { DashboardTone } from "@/features/shared/types";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import { getApiErrorMessage } from "@/lib/api/api-client";
import {
  type AttendanceRecord,
  type AuditLogRow,
  type ContractRow,
  type PayrollPreviewEmployee,
  type PerformanceEmployee,
  type RosterDay,
  type ShiftRow,
  type WorkforceEmployee,
  workforceApi,
} from "@/lib/api/workforce-api";
import { hppApi, type HppCostComponent } from "@/lib/api/hpp-api";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmtDuration(minutes: number): string {
  if (!minutes) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LoadingShell({ title, description }: { title: string; description: string }) {
  return (
    <DashboardShell title={title} description={description}>
      <div className="flex h-48 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </DashboardShell>
  );
}

function ErrorShell({
  title,
  description,
  error,
}: {
  title: string;
  description: string;
  error: unknown;
}) {
  return (
    <DashboardShell title={title} description={description}>
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {getApiErrorMessage(error, "Failed to load data. Please try again.")}
        </p>
      </div>
    </DashboardShell>
  );
}

function EmptyShell({
  title,
  description,
  message,
}: {
  title: string;
  description: string;
  message: string;
}) {
  return (
    <DashboardShell title={title} description={description}>
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <p className="text-sm">{message}</p>
      </div>
    </DashboardShell>
  );
}

function InfoPanel({ label, items }: { label: string; items: { key: string; value: string }[] }) {
  return (
    <DashboardPanel title={label} description="">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{item.key}</span>
            <span className="font-medium">{item.value}</span>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

// ─── HPP Calculator ───────────────────────────────────────────────────────────

const hppColumns: DataTableColumn<HppCostComponent>[] = [
  { key: "name", header: "Ingredient / Item", cell: (r) => r.name },
  { key: "category", header: "Category", cell: (r) => r.category },
  { key: "unitCost", header: "Unit Cost", cell: (r) => formatCurrency(r.unitCost) },
  { key: "quantity", header: "Qty", cell: (r) => String(r.quantity) },
  { key: "unit", header: "Unit", cell: (r) => r.unit },
  { key: "totalCost", header: "Total Cost", cell: (r) => formatCurrency(r.totalCost) },
  { key: "note", header: "Note", cell: (r) => r.note ?? "-" },
];

export function HppCalculatorDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["hpp-summary"],
    queryFn: () => hppApi.summary(),
    staleTime: 60_000,
  });

  if (isLoading)
    return (
      <LoadingShell title="HPP / COGS Calculator" description="Loading latest batch cost analysis…" />
    );
  if (isError)
    return (
      <ErrorShell
        title="HPP / COGS Calculator"
        description="Cost-of-goods analysis per production batch"
        error={error}
      />
    );
  if (!data)
    return (
      <EmptyShell
        title="HPP / COGS Calculator"
        description="Cost-of-goods analysis per production batch"
        message="No batches found. Create your first HPP batch to start tracking production costs."
      />
    );

  const { batch, components, stats } = data;

  return (
    <DashboardShell
      title="HPP / COGS Calculator"
      description={`Batch: ${batch.name} — ${fmtDate(batch.batchDate)}`}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Cost" value={formatCurrency(stats.totalCost)} icon={BarChart3} tone="blue" />
        <StatCard label="HPP / Unit" value={formatCurrency(stats.hppPerUnit)} icon={TrendingUp} tone="green" />
        <StatCard label="Suggested Price" value={formatCurrency(stats.suggestedPrice)} icon={FileText} tone="amber" />
        <StatCard label="Output Units" value={String(batch.outputUnits)} icon={Hash} tone="rose" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <DashboardPanel title="Cost Components" description="Ingredients and materials for this batch">
          <DataTable columns={hppColumns} data={components} getRowKey={(r) => r.id} />
        </DashboardPanel>

        <InfoPanel
          label="Batch Details"
          items={[
            { key: "Batch Name", value: batch.name },
            { key: "Date", value: fmtDate(batch.batchDate) },
            { key: "Target Margin", value: `${batch.targetMargin}%` },
            { key: "Output Units", value: String(batch.outputUnits) },
            { key: "Notes", value: batch.notes ?? "—" },
            ...Object.entries(stats.byCategory).map(([cat, total]) => ({
              key: cat,
              value: formatCurrency(total as number),
            })),
          ]}
        />
      </div>
    </DashboardShell>
  );
}

// ─── Shift Reports ────────────────────────────────────────────────────────────

function shiftStatusTone(status: string): DashboardTone {
  return status === "CLOSED" ? "green" : "blue";
}

const shiftColumns: DataTableColumn<ShiftRow>[] = [
  { key: "pic", header: "PIC", cell: (r) => r.pic },
  { key: "role", header: "Role", cell: (r) => r.role },
  {
    key: "openedAt",
    header: "Opened",
    cell: (r) => fmtTime(r.openedAt),
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => <StatusPill tone={shiftStatusTone(r.status)}>{r.status}</StatusPill>,
  },
  {
    key: "revenue",
    header: "Revenue",
    cell: (r) => formatCurrency(r.revenue),
  },
  {
    key: "variance",
    header: "Variance",
    cell: (r) => (
      <span className={r.variance !== 0 ? "text-destructive" : "text-green-600"}>
        {r.variance !== 0 ? formatCurrency(Math.abs(r.variance)) : "—"}
      </span>
    ),
  },
  {
    key: "orderCount",
    header: "Orders",
    cell: (r) => String(r.orderCount),
  },
];

export function ShiftReportsDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["workforce-shift-summary"],
    queryFn: () => workforceApi.shiftSummary(),
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingShell title="Shift Reports" description="Loading shift data…" />;
  if (isError)
    return (
      <ErrorShell title="Shift Reports" description="Cash shift reconciliation overview" error={error} />
    );

  const { shifts, stats } = data!;

  return (
    <DashboardShell title="Shift Reports" description="Cash shift reconciliation overview">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} tone="green" />
        <StatCard
          label="Cash Variance"
          value={formatCurrency(Math.abs(stats.totalVariance))}
          icon={AlertTriangle}
          tone={stats.totalVariance !== 0 ? "red" : "green"}
        />
        <StatCard label="Closed Shifts" value={String(stats.closed)} icon={CheckCircle2} tone="blue" />
        <StatCard
          label="Needs Review"
          value={String(stats.needsReview)}
          icon={Shield}
          tone={stats.needsReview > 0 ? "amber" : "green"}
        />
      </div>

      <DashboardPanel title="Shift Log" description="Most recent shifts">
        <DataTable columns={shiftColumns} data={shifts} getRowKey={(r) => r.id} />
      </DashboardPanel>
    </DashboardShell>
  );
}

// ─── Team Management (employee overview) ─────────────────────────────────────

function employeeStatusTone(status: string): DashboardTone {
  return status === "Active" ? "green" : "slate";
}

function attendanceTone(status: string | null): DashboardTone {
  if (status === "PRESENT") return "green";
  if (status === "LATE") return "amber";
  if (status === "ABSENT") return "red";
  return "slate";
}

const employeeColumns: DataTableColumn<WorkforceEmployee>[] = [
  { key: "name", header: "Name", cell: (r) => r.name },
  { key: "email", header: "Email", cell: (r) => r.email },
  { key: "role", header: "Role", cell: (r) => r.role },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <StatusPill tone={employeeStatusTone(r.status)}>{r.status}</StatusPill>
    ),
  },
  {
    key: "attendanceStatus",
    header: "Today",
    cell: (r) =>
      r.attendanceStatus ? (
        <StatusPill tone={attendanceTone(r.attendanceStatus)}>{r.attendanceStatus}</StatusPill>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "clockInAt",
    header: "Clock-in",
    cell: (r) => (r.clockInAt ? fmtTime(r.clockInAt) : "—"),
  },
  {
    key: "joinedAt",
    header: "Joined",
    cell: (r) => fmtDate(r.joinedAt),
  },
];

export function TeamManagementDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["workforce-employees"],
    queryFn: () => workforceApi.employees(),
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingShell title="Team Management" description="Loading team data…" />;
  if (isError)
    return (
      <ErrorShell
        title="Team Management"
        description="Active employees and today's attendance"
        error={error}
      />
    );

  const { employees, stats } = data!;

  return (
    <DashboardShell title="Team Management" description="Active employees and today's attendance">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Employees" value={String(stats.total)} icon={Users} tone="blue" />
        <StatCard label="Active" value={String(stats.active)} icon={UserCheck} tone="green" />
        <StatCard label="Present Today" value={String(stats.presentToday)} icon={CheckCircle2} tone="amber" />
        <StatCard label="Clocked Out" value={String(stats.clockedOut)} icon={Clock} tone="slate" />
      </div>

      <DashboardPanel title="Employee Directory" description="All team members with today's attendance">
        <DataTable columns={employeeColumns} data={employees} getRowKey={(r) => r.id} />
      </DashboardPanel>
    </DashboardShell>
  );
}

// ─── Shift Overview / Roster ──────────────────────────────────────────────────

const rosterColumns: DataTableColumn<RosterDay>[] = [
  { key: "date", header: "Date", cell: (r) => r.date },
  { key: "staffCount", header: "Staff", cell: (r) => String(r.staffCount) },
  { key: "closedShifts", header: "Closed Shifts", cell: (r) => String(r.closedShifts) },
  {
    key: "openShifts",
    header: "Open Shifts",
    cell: (r) =>
      r.openShifts > 0 ? (
        <span className="font-medium text-amber-600">{r.openShifts}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "revenue",
    header: "Revenue",
    cell: (r) => (r.revenue > 0 ? formatCurrency(r.revenue) : "—"),
  },
];

export function ShiftOverviewDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["workforce-roster-summary"],
    queryFn: () => workforceApi.rosterSummary(),
    staleTime: 60_000,
  });

  if (isLoading)
    return <LoadingShell title="Shift Overview" description="Loading roster data…" />;
  if (isError)
    return (
      <ErrorShell title="Shift Overview" description="Shift roster for the last 14 days" error={error} />
    );

  const { days, stats } = data!;

  return (
    <DashboardShell title="Shift Overview" description="Shift roster for the last 14 days">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Days Tracked" value={String(stats.totalDays)} icon={CalendarDays} tone="blue" />
        <StatCard label="Avg Staff / Day" value={String(stats.avgStaff)} icon={Users} tone="slate" />
        <StatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} tone="green" />
        <StatCard
          label="Open Shifts"
          value={String(stats.openShifts)}
          icon={AlertTriangle}
          tone={stats.openShifts > 0 ? "amber" : "green"}
        />
      </div>

      <DashboardPanel title="Daily Roster" description="Shift breakdown by day">
        <DataTable columns={rosterColumns} data={days} getRowKey={(r) => r.date} />
      </DashboardPanel>
    </DashboardShell>
  );
}

// ─── Employee Performance ─────────────────────────────────────────────────────

function scoreTone(score: number): DashboardTone {
  if (score >= 80) return "green";
  if (score >= 60) return "amber";
  return "red";
}

const performanceColumns: DataTableColumn<PerformanceEmployee>[] = [
  { key: "name", header: "Employee", cell: (r) => r.name },
  { key: "role", header: "Role", cell: (r) => r.role },
  {
    key: "score",
    header: "Score",
    cell: (r) => (
      <StatusPill tone={scoreTone(r.score)}>{`${r.score} / 100`}</StatusPill>
    ),
  },
  {
    key: "attendanceRate",
    header: "Attendance",
    cell: (r) => `${r.attendanceRate}%`,
  },
  { key: "presentDays", header: "Present", cell: (r) => String(r.presentDays) },
  {
    key: "lateDays",
    header: "Late",
    cell: (r) =>
      r.lateDays > 0 ? (
        <span className="text-amber-600">{r.lateDays}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    key: "totalWorkMinutes",
    header: "Work Hours",
    cell: (r) => fmtDuration(r.totalWorkMinutes),
  },
  {
    key: "overtimeMinutes",
    header: "Overtime",
    cell: (r) => (r.overtimeMinutes > 0 ? fmtDuration(r.overtimeMinutes) : "—"),
  },
];

export function EmployeePerformanceDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["workforce-performance"],
    queryFn: () => workforceApi.performanceSummary(),
    staleTime: 60_000,
  });

  if (isLoading)
    return <LoadingShell title="Employee Performance" description="Computing performance metrics…" />;
  if (isError)
    return (
      <ErrorShell
        title="Employee Performance"
        description="Attendance-based performance scores"
        error={error}
      />
    );

  const { employees, stats, periodDays } = data!;
  const top = employees[0];

  return (
    <DashboardShell
      title="Employee Performance"
      description={`Attendance-based scores — last ${periodDays} days`}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Avg Score" value={`${stats.avgScore} / 100`} icon={TrendingUp} tone="blue" />
        <StatCard label="Avg Attendance" value={`${stats.avgAttendanceRate}%`} icon={UserCheck} tone="green" />
        <StatCard label="Top Performer" value={top?.name ?? "—"} icon={CheckCircle2} tone="amber" />
        <StatCard label="Employees" value={String(stats.totalEmployees)} icon={Users} tone="slate" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <DashboardPanel title="Performance Ranking" description="Sorted by score — higher is better">
          <DataTable columns={performanceColumns} data={employees} getRowKey={(r) => r.userId} />
        </DashboardPanel>

        <InfoPanel
          label="Score Methodology"
          items={[
            { key: "Attendance weight", value: "85%" },
            { key: "Late-arrival penalty", value: "−15 pts / rate" },
            { key: "Overtime bonus", value: "+0.5 pt / hr (max 5)" },
            { key: "Working days estimate", value: String(stats.workingDays) },
            { key: "Period", value: `${periodDays} days` },
          ]}
        />
      </div>
    </DashboardShell>
  );
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

const auditColumns: DataTableColumn<AuditLogRow>[] = [
  { key: "event", header: "Event", cell: (r) => r.event },
  { key: "actor", header: "Actor", cell: (r) => r.actor },
  { key: "actorRole", header: "Role", cell: (r) => r.actorRole },
  { key: "module", header: "Module", cell: (r) => r.module },
  { key: "entityId", header: "Entity ID", cell: (r) => r.entityId.slice(0, 8) + "…" },
  {
    key: "createdAt",
    header: "Time",
    cell: (r) => (
      <span title={r.createdAt}>
        {fmtDate(r.createdAt)} {fmtTime(r.createdAt)}
      </span>
    ),
  },
];

export function AuditLogDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["workforce-audit-log"],
    queryFn: () => workforceApi.auditLog(),
    staleTime: 30_000,
  });

  if (isLoading) return <LoadingShell title="Audit Log" description="Loading system events…" />;
  if (isError)
    return <ErrorShell title="Audit Log" description="System-wide activity trail" error={error} />;

  const { logs, stats } = data!;

  return (
    <DashboardShell title="Audit Log" description="System-wide activity trail">
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Events Today" value={String(stats.eventsToday)} icon={CalendarDays} tone="blue" />
        <StatCard label="Records Loaded" value={String(stats.totalRecords)} icon={FileText} tone="slate" />
        <StatCard label="Modules Active" value={String(stats.uniqueModules)} icon={BarChart3} tone="green" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <DashboardPanel title="Recent Events" description="Latest 30 system actions">
          <DataTable columns={auditColumns} data={logs} getRowKey={(r) => r.id} />
        </DashboardPanel>

        <InfoPanel
          label="Active Modules"
          items={stats.moduleList.map((m) => ({ key: m, value: "✓" }))}
        />
      </div>
    </DashboardShell>
  );
}

// ─── Approvals (no schema yet — informational) ────────────────────────────────

export function ApprovalDashboard() {
  return (
    <DashboardShell title="Approvals" description="Workflow approval queue — not yet configured">
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <Shield className="h-8 w-8 opacity-40" />
        <p className="max-w-sm text-sm">
          The approvals workflow engine is not yet set up. To enable this feature, configure approval
          rules in Settings → Workflow.
        </p>
      </div>
    </DashboardShell>
  );
}

// ─── Employee Contracts ───────────────────────────────────────────────────────

function contractTypeTone(contractType: string): DashboardTone {
  if (contractType === "Permanent") return "blue";
  if (contractType === "Regular") return "green";
  if (contractType === "Back Office") return "rose";
  return "slate";
}

const contractColumns: DataTableColumn<ContractRow>[] = [
  { key: "name", header: "Employee", cell: (r) => r.name },
  { key: "email", header: "Email", cell: (r) => r.email },
  { key: "role", header: "Role", cell: (r) => r.role },
  {
    key: "contractType",
    header: "Contract Type",
    cell: (r) => (
      <StatusPill tone={contractTypeTone(r.contractType)}>{r.contractType}</StatusPill>
    ),
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <StatusPill tone={r.status === "Active" ? "green" : "red"}>{r.status}</StatusPill>
    ),
  },
  {
    key: "startDate",
    header: "Since",
    cell: (r) => fmtDate(r.startDate),
  },
];

export function EmployeeContractsDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["workforce-contracts"],
    queryFn: () => workforceApi.contracts(),
    staleTime: 120_000,
  });

  if (isLoading)
    return <LoadingShell title="Employee Contracts" description="Loading contract records…" />;
  if (isError)
    return (
      <ErrorShell title="Employee Contracts" description="Contract overview by employee" error={error} />
    );

  const { contracts, stats, note } = data!;

  return (
    <DashboardShell title="Employee Contracts" description="Contract overview by employee">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={String(stats.total)} icon={Users} tone="blue" />
        <StatCard label="Active" value={String(stats.active)} icon={UserCheck} tone="green" />
        {Object.entries(stats.byType).map(([type, count]) => (
          <StatCard key={type} label={type} value={String(count)} icon={FileText} tone="slate" />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <DashboardPanel title="Contract List" description="All employees with derived contract info">
          <DataTable columns={contractColumns} data={contracts} getRowKey={(r) => r.userId} />
        </DashboardPanel>

        <div className="flex flex-col gap-4">
          <InfoPanel
            label="By Contract Type"
            items={Object.entries(stats.byType).map(([type, count]) => ({
              key: type,
              value: String(count),
            }))}
          />
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {note}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

// ─── Employee Attendance ──────────────────────────────────────────────────────

const attendanceColumns: DataTableColumn<AttendanceRecord>[] = [
  { key: "employeeName", header: "Employee", cell: (r) => r.employeeName },
  { key: "employeeRole", header: "Role", cell: (r) => r.employeeRole },
  { key: "date", header: "Date", cell: (r) => r.date },
  { key: "clockInAt", header: "Clock-in", cell: (r) => fmtTime(r.clockInAt) },
  {
    key: "clockOutAt",
    header: "Clock-out",
    cell: (r) => (r.clockOutAt ? fmtTime(r.clockOutAt) : "—"),
  },
  {
    key: "status",
    header: "Status",
    cell: (r) => (
      <StatusPill tone={attendanceTone(r.status)}>{r.status}</StatusPill>
    ),
  },
  {
    key: "workDurationMinutes",
    header: "Duration",
    cell: (r) => fmtDuration(r.workDurationMinutes),
  },
  {
    key: "overtimeMinutes",
    header: "Overtime",
    cell: (r) => (r.overtimeMinutes > 0 ? fmtDuration(r.overtimeMinutes) : "—"),
  },
];

export function EmployeeAttendanceDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["workforce-attendance"],
    queryFn: () => workforceApi.attendance(),
    staleTime: 30_000,
  });

  if (isLoading)
    return <LoadingShell title="Employee Attendance" description="Loading attendance records…" />;
  if (isError)
    return (
      <ErrorShell
        title="Employee Attendance"
        description="Daily clock-in/out records"
        error={error}
      />
    );

  const { records, stats } = data!;

  return (
    <DashboardShell title="Employee Attendance" description="Daily clock-in/out records">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Present Today" value={String(stats.presentToday)} icon={CheckCircle2} tone="green" />
        <StatCard
          label="Late Today"
          value={String(stats.lateToday)}
          icon={AlertTriangle}
          tone={stats.lateToday > 0 ? "amber" : "green"}
        />
        <StatCard label="Active Shift" value={String(stats.activeShift)} icon={Clock} tone="blue" />
        <StatCard label="Records Loaded" value={String(stats.totalRecords)} icon={FileText} tone="slate" />
      </div>

      <DashboardPanel title="Attendance Log" description="Latest 50 clock-in records">
        <DataTable columns={attendanceColumns} data={records} getRowKey={(r) => r.id} />
      </DashboardPanel>
    </DashboardShell>
  );
}

// ─── Payroll Preview ──────────────────────────────────────────────────────────

const payrollColumns: DataTableColumn<PayrollPreviewEmployee>[] = [
  { key: "name", header: "Employee", cell: (r) => r.name },
  { key: "role", header: "Role", cell: (r) => r.role },
  { key: "presentDays", header: "Present", cell: (r) => String(r.presentDays) },
  {
    key: "lateDays",
    header: "Late",
    cell: (r) =>
      r.lateDays > 0 ? (
        <span className="text-amber-600">{r.lateDays}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  { key: "attendanceDays", header: "Recorded", cell: (r) => String(r.attendanceDays) },
  { key: "totalWorkMinutes", header: "Work Hours", cell: (r) => fmtDuration(r.totalWorkMinutes) },
  {
    key: "overtimeMinutes",
    header: "Overtime",
    cell: (r) => (r.overtimeMinutes > 0 ? fmtDuration(r.overtimeMinutes) : "—"),
  },
];

export function PayrollDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["workforce-payroll-preview"],
    queryFn: () => workforceApi.payrollPreview(),
    staleTime: 60_000,
  });

  if (isLoading)
    return <LoadingShell title="Payroll Preview" description="Computing attendance metrics…" />;
  if (isError)
    return (
      <ErrorShell
        title="Payroll Preview"
        description="Monthly attendance summary for payroll"
        error={error}
      />
    );

  const { employees, stats, period } = data!;

  return (
    <DashboardShell
      title="Payroll Preview"
      description={`Attendance metrics for payroll preparation — ${period}`}
    >
      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
        Base salary is not configured in this system. This view shows attendance-based metrics to
        support payroll preparation. Configure employee base salaries to enable full payroll
        calculation.
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Employees" value={String(stats.totalEmployees)} icon={Users} tone="blue" />
        <StatCard
          label="Avg Present Rate"
          value={`${Math.round(stats.avgPresentRate * 100)}%`}
          icon={UserCheck}
          tone="green"
        />
        <StatCard
          label="Attendance Days"
          value={String(stats.totalAttendanceDays)}
          icon={CalendarDays}
          tone="slate"
        />
        <StatCard
          label="Total Overtime"
          value={fmtDuration(stats.totalOvertimeMinutes)}
          icon={Clock}
          tone="amber"
        />
      </div>

      <DashboardPanel
        title="Attendance Summary"
        description={`Period: ${period} — all active employees`}
      >
        <DataTable columns={payrollColumns} data={employees} getRowKey={(r) => r.userId} />
      </DashboardPanel>
    </DashboardShell>
  );
}
