"use client";

import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  BarChart3,
  CalendarDays,
  CreditCard,
  FileText,
  LockKeyhole,
  Percent,
  ReceiptText,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import type { DashboardTone } from "@/features/shared/types";

type Insight = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: DashboardTone;
};

type ProgressItem = {
  label: string;
  value: string;
  percent: number;
  tone: DashboardTone;
};

type TimelineItem = {
  title: string;
  meta: string;
  description: string;
  status: string;
};

type ChecklistItem = {
  label: string;
  owner: string;
  status: string;
};

type ExtraConfig = {
  insights?: Insight[];
  progressTitle?: string;
  progressDescription?: string;
  progress?: ProgressItem[];
  timelineTitle?: string;
  timelineDescription?: string;
  timeline?: TimelineItem[];
  checklistTitle?: string;
  checklistDescription?: string;
  checklist?: ChecklistItem[];
};

const statusTone: Record<string, DashboardTone> = {
  Active: "green",
  Approved: "green",
  Completed: "green",
  Ready: "green",
  Signed: "green",
  Planned: "blue",
  Published: "blue",
  Draft: "slate",
  Expiring: "amber",
  Pending: "amber",
  Review: "amber",
  Warning: "amber",
  Critical: "rose",
  Needed: "rose",
  Overdue: "rose",
};

function getStatusTone(status: string): DashboardTone {
  return statusTone[status] ?? "slate";
}

function ProgressPanel({ title, description, items }: { title: string; description: string; items: ProgressItem[] }) {
  return (
    <DashboardPanel title={title} description={description}>
      <div className="grid gap-4 p-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-foreground">{item.label}</span>
              <StatusPill tone={item.tone}>{item.value}</StatusPill>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${item.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function TimelinePanel({ title, description, items }: { title: string; description: string; items: TimelineItem[] }) {
  return (
    <DashboardPanel title={title} description={description}>
      <div className="grid gap-3 p-4">
        {items.map((item) => (
          <div key={`${item.title}-${item.meta}`} className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{item.meta}</p>
              </div>
              <StatusPill tone={getStatusTone(item.status)}>{item.status}</StatusPill>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function ChecklistPanel({ title, description, items }: { title: string; description: string; items: ChecklistItem[] }) {
  return (
    <DashboardPanel title={title} description={description}>
      <div className="grid gap-3 p-4">
        {items.map((item) => (
          <div key={`${item.label}-${item.owner}`} className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">Owner: {item.owner}</p>
            </div>
            <StatusPill tone={getStatusTone(item.status)}>{item.status}</StatusPill>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

function WorkforceOperationExtras({ config }: { config: ExtraConfig }) {
  return (
    <div className="mt-5 grid gap-5">
      {config.insights && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {config.insights.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} note={item.note} icon={item.icon} tone={item.tone} />
          ))}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {config.progress && config.progressTitle && config.progressDescription && (
          <ProgressPanel title={config.progressTitle} description={config.progressDescription} items={config.progress} />
        )}
        {config.timeline && config.timelineTitle && config.timelineDescription && (
          <TimelinePanel title={config.timelineTitle} description={config.timelineDescription} items={config.timeline} />
        )}
        {config.checklist && config.checklistTitle && config.checklistDescription && (
          <ChecklistPanel title={config.checklistTitle} description={config.checklistDescription} items={config.checklist} />
        )}
      </div>
    </div>
  );
}

const hppConfig: ExtraConfig = {
  insights: [
    { label: "Break-even Price", value: "Rp 16.086", note: "Harga minimum sebelum promo, platform fee, dan pajak. Jangan jual di bawah ini kecuali sengaja bakar uang.", icon: Target, tone: "amber" },
    { label: "Safe Menu Price", value: "Rp 25.945", note: "Simulasi harga dengan target gross margin 38%.", icon: Percent, tone: "green" },
    { label: "Waste Exposure", value: "4.1%", note: "Weighted dummy waste dari ayam, sayur, sauce, dan bahan segar.", icon: TrendingDown, tone: "rose" },
    { label: "Batch Profit", value: "Rp 8,2 jt", note: "Estimasi gross profit kalau semua batch unit terjual.", icon: TrendingUp, tone: "blue" },
  ],
  progressTitle: "Pricing Scenario",
  progressDescription: "Dummy scenario untuk lihat efek harga jual terhadap margin.",
  progress: [
    { label: "Promo price Rp 19.000", value: "28% margin", percent: 28, tone: "amber" },
    { label: "Base price Rp 21.500", value: "38% margin", percent: 38, tone: "green" },
    { label: "Premium price Rp 24.000", value: "46% margin", percent: 46, tone: "blue" },
  ],
  checklistTitle: "Cost Control Notes",
  checklistDescription: "Catatan dummy buat owner sebelum approve harga menu.",
  checklist: [
    { label: "Lock supplier price for chicken this week", owner: "Inventory Lead", status: "Pending" },
    { label: "Review vegetable waste above 5%", owner: "Kitchen Lead", status: "Review" },
    { label: "Confirm packaging stock before promo", owner: "Warehouse", status: "Ready" },
    { label: "Create margin approval threshold", owner: "Owner", status: "Draft" },
  ],
};

const shiftReportConfig: ExtraConfig = {
  progressTitle: "Payment Mix",
  progressDescription: "Dummy komposisi payment dari shift berjalan.",
  progress: [
    { label: "QRIS", value: "58%", percent: 58, tone: "green" },
    { label: "Cash", value: "29%", percent: 29, tone: "amber" },
    { label: "Card", value: "13%", percent: 13, tone: "blue" },
  ],
  timelineTitle: "Closing Issues",
  timelineDescription: "Masalah dummy yang perlu diselesaikan sebelum lock shift.",
  timeline: [
    { title: "Afternoon cash short", meta: "Raka • 18:10", description: "Selisih kas Rp 85.000 perlu bukti adjustment atau supervisor note.", status: "Review" },
    { title: "Warehouse intake variance", meta: "Dimas • 16:40", description: "Ada selisih nilai intake karena koreksi harga supplier dummy.", status: "Pending" },
    { title: "Morning shift locked", meta: "Nadia • 14:05", description: "Cash drawer, QRIS settlement, dan sales summary sudah match.", status: "Completed" },
  ],
};

const teamConfig: ExtraConfig = {
  progressTitle: "Department Load",
  progressDescription: "Dummy load by team area. Nanti dihitung dari shift, task, dan attendance.",
  progress: [
    { label: "Front Office", value: "92% staffed", percent: 92, tone: "green" },
    { label: "Kitchen", value: "84% staffed", percent: 84, tone: "blue" },
    { label: "Warehouse", value: "61% staffed", percent: 61, tone: "amber" },
    { label: "Finance", value: "74% staffed", percent: 74, tone: "slate" },
  ],
  checklistTitle: "Onboarding Pipeline",
  checklistDescription: "Tugas dummy untuk employee baru.",
  checklist: [
    { label: "Create app account for Dimas", owner: "Owner", status: "Pending" },
    { label: "Assign inventory permission set", owner: "Manager", status: "Review" },
    { label: "Upload probation contract", owner: "Finance", status: "Draft" },
    { label: "Schedule first warehouse shift", owner: "Ops", status: "Ready" },
  ],
};

const shiftOverviewConfig: ExtraConfig = {
  insights: [
    { label: "Peak Risk", value: "Friday", note: "Demand tinggi tapi masih ada 1 open slot.", icon: AlertTriangle, tone: "rose" },
    { label: "Best Coverage", value: "Thursday", note: "Full day staffed, cocok untuk promo prep atau inventory count.", icon: BadgeCheck, tone: "green" },
    { label: "Leave Buffer", value: "2 people", note: "Dummy buffer minimal supaya schedule tidak langsung runtuh.", icon: UserCheck, tone: "blue" },
    { label: "Draft Schedule", value: "5 days", note: "Semua jadwal di layar ini masih belum publish.", icon: CalendarDays, tone: "slate" },
  ],
  checklistTitle: "Roster Publish Checklist",
  checklistDescription: "Checklist dummy sebelum jadwal dikunci dan dikirim ke team.",
  checklist: [
    { label: "Resolve Wednesday night open slots", owner: "Manager", status: "Review" },
    { label: "Confirm Friday promo staffing", owner: "Ops Lead", status: "Warning" },
    { label: "Check overtime risk for Nadia", owner: "HR/Admin", status: "Pending" },
    { label: "Publish weekly roster after approval", owner: "Owner", status: "Draft" },
  ],
};

const performanceConfig: ExtraConfig = {
  progressTitle: "KPI Weight Simulation",
  progressDescription: "Bobot dummy untuk scoring. Nanti jangan hardcode kalau sudah serius.",
  progress: [
    { label: "Attendance reliability", value: "25%", percent: 25, tone: "blue" },
    { label: "Cash / stock accuracy", value: "30%", percent: 30, tone: "green" },
    { label: "Task completion", value: "25%", percent: 25, tone: "amber" },
    { label: "Manager review", value: "20%", percent: 20, tone: "slate" },
  ],
  timelineTitle: "Coaching Queue",
  timelineDescription: "Action item dummy yang lebih manusiawi daripada cuma ngasih angka merah.",
  timeline: [
    { title: "Inventory correction coaching", meta: "Dimas • Warehouse", description: "Review flow stock correction dan minta double-check sebelum adjustment besar.", status: "Review" },
    { title: "Kitchen waste improvement", meta: "Bima • Kitchen", description: "Waste medium, perlu briefing prep quantity saat demand rendah.", status: "Pending" },
    { title: "Cashier SOP replication", meta: "Nadia • Front Office", description: "Pakai Nadia sebagai benchmark SOP cashier closing.", status: "Ready" },
  ],
};

const auditConfig: ExtraConfig = {
  progressTitle: "Risk Monitor",
  progressDescription: "Dummy risk grouping supaya audit tidak cuma jadi museum log.",
  progress: [
    { label: "Financial actions", value: "6 events", percent: 60, tone: "amber" },
    { label: "Inventory corrections", value: "4 events", percent: 40, tone: "rose" },
    { label: "Auth/security", value: "2 events", percent: 20, tone: "blue" },
    { label: "Menu/config changes", value: "6 events", percent: 60, tone: "green" },
  ],
  checklistTitle: "Security Review Queue",
  checklistDescription: "Apa yang perlu dilihat owner/admin.",
  checklist: [
    { label: "Investigate failed login attempt", owner: "Owner", status: "Critical" },
    { label: "Review payroll export actor", owner: "Finance", status: "Review" },
    { label: "Validate inventory correction reason", owner: "Manager", status: "Warning" },
    { label: "Archive supplier approval proof", owner: "Ops", status: "Ready" },
  ],
};

const approvalConfig: ExtraConfig = {
  progressTitle: "Approval SLA",
  progressDescription: "Dummy SLA per jenis request.",
  progress: [
    { label: "Stock purchase", value: "6h limit", percent: 70, tone: "amber" },
    { label: "Payroll adjustment", value: "24h limit", percent: 90, tone: "rose" },
    { label: "Contract renewal", value: "72h limit", percent: 35, tone: "green" },
    { label: "Margin override", value: "4h limit", percent: 55, tone: "blue" },
  ],
  timelineTitle: "Approval Flow Preview",
  timelineDescription: "Simulasi flow sebelum backend workflow engine ada.",
  timeline: [
    { title: "Request created", meta: "Requester submits data", description: "Request masuk dengan amount, reason, attachment, dan target approver.", status: "Completed" },
    { title: "Policy matched", meta: "Rule engine draft", description: "Sistem menentukan owner, manager, atau finance yang perlu approve.", status: "Draft" },
    { title: "Decision logged", meta: "Audit trail", description: "Approve/reject nanti harus otomatis masuk audit log, bukan hilang di chat.", status: "Planned" },
  ],
};

const contractConfig: ExtraConfig = {
  timelineTitle: "Renewal Timeline",
  timelineDescription: "Dummy timeline untuk kontrak yang mendekati expired.",
  timeline: [
    { title: "Raka contract renewal", meta: "Due in 79 days", description: "Part-time contract perlu review rate hourly dan availability.", status: "Expiring" },
    { title: "Dimas probation confirmation", meta: "Due in 79 days", description: "Probation perlu manager evaluation sebelum jadi active contract.", status: "Pending" },
    { title: "Nadia annual contract", meta: "Due in 201 days", description: "Full-time renewal masih aman, bisa ditunda.", status: "Active" },
  ],
  checklistTitle: "Document Checklist",
  checklistDescription: "Minimum dokumen yang nanti harus dilacak.",
  checklist: [
    { label: "Signed contract PDF", owner: "Finance/Admin", status: "Ready" },
    { label: "Salary term approval", owner: "Owner", status: "Planned" },
    { label: "Identity document reference", owner: "HR/Admin", status: "Draft" },
    { label: "Contract renewal approval", owner: "Manager", status: "Pending" },
  ],
};

const attendanceConfig: ExtraConfig = {
  progressTitle: "Attendance Health",
  progressDescription: "Ringkasan dummy kualitas absensi hari ini.",
  progress: [
    { label: "On-time check-in", value: "2/4", percent: 50, tone: "green" },
    { label: "Late arrival", value: "2 cases", percent: 50, tone: "amber" },
    { label: "Missing check-in", value: "1 case", percent: 25, tone: "rose" },
    { label: "Completed shift", value: "2/4", percent: 50, tone: "blue" },
  ],
  checklistTitle: "Correction Queue",
  checklistDescription: "Antrian koreksi manual yang nanti wajib lewat approval.",
  checklist: [
    { label: "Dimas missing warehouse check-in", owner: "Supervisor", status: "Pending" },
    { label: "Raka late arrival note", owner: "Manager", status: "Review" },
    { label: "Nadia 1 minute tolerance", owner: "System", status: "Ready" },
    { label: "Lock attendance before payroll", owner: "Finance", status: "Draft" },
  ],
};

const payrollConfig: ExtraConfig = {
  insights: [
    { label: "Payroll Batch", value: "June 2026", note: "Batch dummy untuk periode berjalan.", icon: CalendarDays, tone: "blue" },
    { label: "Payment Method", value: "Bank Transfer", note: "Dummy payout channel. Belum ada bank account encryption.", icon: CreditCard, tone: "green" },
    { label: "Approval Needed", value: "2 records", note: "Review dan pending employee tidak boleh dipayout dulu.", icon: LockKeyhole, tone: "amber" },
    { label: "Journal Status", value: "Not posted", note: "Cashflow/finance journal sengaja belum disentuh.", icon: ReceiptText, tone: "slate" },
  ],
  checklistTitle: "Payroll Readiness",
  checklistDescription: "Checklist dummy sebelum payroll bisa dieksekusi.",
  checklist: [
    { label: "Lock attendance period", owner: "Finance", status: "Pending" },
    { label: "Resolve Raka deduction note", owner: "Manager", status: "Review" },
    { label: "Approve Dimas probation payroll", owner: "Owner", status: "Pending" },
    { label: "Generate payslip preview", owner: "System", status: "Draft" },
  ],
  timelineTitle: "Payout Timeline",
  timelineDescription: "Flow dummy payroll dari draft sampai posted.",
  timeline: [
    { title: "Draft payroll generated", meta: "Finance • Today 10:00", description: "Payroll batch dibuat dari kontrak dan attendance dummy.", status: "Completed" },
    { title: "Manager review", meta: "Manager • Waiting", description: "Cek deduction, overtime, dan status karyawan pending.", status: "Review" },
    { title: "Owner approval", meta: "Owner • Required", description: "Final approval sebelum payout. Uang keluar tanpa approval itu bencana dengan UI.", status: "Pending" },
  ],
};

export function HppCalculatorExtras() {
  return <WorkforceOperationExtras config={hppConfig} />;
}

export function ShiftReportsExtras() {
  return <WorkforceOperationExtras config={shiftReportConfig} />;
}

export function TeamManagementExtras() {
  return <WorkforceOperationExtras config={teamConfig} />;
}

export function ShiftOverviewExtras() {
  return <WorkforceOperationExtras config={shiftOverviewConfig} />;
}

export function EmployeePerformanceExtras() {
  return <WorkforceOperationExtras config={performanceConfig} />;
}

export function AuditLogExtras() {
  return <WorkforceOperationExtras config={auditConfig} />;
}

export function ApprovalExtras() {
  return <WorkforceOperationExtras config={approvalConfig} />;
}

export function EmployeeContractsExtras() {
  return <WorkforceOperationExtras config={contractConfig} />;
}

export function EmployeeAttendanceExtras() {
  return <WorkforceOperationExtras config={attendanceConfig} />;
}

export function PayrollExtras() {
  return <WorkforceOperationExtras config={payrollConfig} />;
}
