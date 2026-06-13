"use client";

import { BadgeDollarSign, ClipboardList, Crown, LifeBuoy, LockKeyhole, Route, ShieldCheck, UserCog } from "lucide-react";

import { StatCard, StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";
import { DataTable, type DataTableColumn } from "@/features/shared/table";
import type { DashboardTone } from "@/features/shared/types";

import {
  adminApiContracts,
  adminEscalationRows,
  adminFeatureGaps,
  adminPermissionMatrix,
  adminRoleCards,
  adminSchemaCandidates,
  getAdminRoleSummary,
  type AdminApiContract,
  type AdminEscalationRow,
  type AdminFeatureGap,
  type AdminPermissionRow,
  type AdminSchemaCandidate,
} from "./admin-role-operations.mock";

const toneMap: Record<string, DashboardTone> = {
  Ready: "green",
  Draft: "amber",
  Gap: "rose",
  Blocked: "rose",
  Low: "green",
  Medium: "amber",
  High: "rose",
  Critical: "rose",
  GET: "green",
  POST: "amber",
  PATCH: "amber",
};

function tone(value: string): DashboardTone {
  return toneMap[value] ?? "slate";
}

const permissionColumns: DataTableColumn<AdminPermissionRow>[] = [
  { key: "capability", header: "Capability", cell: (row) => <span className="font-medium text-foreground">{row.capability}</span> },
  { key: "superAdmin", header: "Super Admin", cell: (row) => <span className="text-sm text-muted-foreground">{row.superAdmin}</span> },
  { key: "billingAdmin", header: "Billing Admin", cell: (row) => <span className="text-sm text-muted-foreground">{row.billingAdmin}</span> },
  { key: "supportOpsAdmin", header: "Support / Ops", cell: (row) => <span className="text-sm text-muted-foreground">{row.supportOpsAdmin}</span> },
  { key: "rule", header: "Rule", cell: (row) => <span className="text-sm text-muted-foreground">{row.rule}</span> },
];

const featureColumns: DataTableColumn<AdminFeatureGap>[] = [
  { key: "feature", header: "Feature", cell: (row) => <span className="font-medium text-foreground">{row.feature}</span> },
  { key: "targetRole", header: "Target Role", cell: (row) => row.targetRole },
  { key: "currentState", header: "Current State", cell: (row) => <span className="text-sm text-muted-foreground">{row.currentState}</span> },
  { key: "neededFor", header: "Needed For", cell: (row) => <span className="text-sm text-muted-foreground">{row.neededFor}</span> },
  { key: "futureApi", header: "Future API", cell: (row) => <code className="text-xs text-muted-foreground">{row.futureApi}</code> },
  { key: "futureSchema", header: "Future Schema", cell: (row) => <code className="text-xs text-muted-foreground">{row.futureSchema}</code> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const apiColumns: DataTableColumn<AdminApiContract>[] = [
  { key: "method", header: "Method", cell: (row) => <StatusPill tone={tone(row.method)}>{row.method}</StatusPill> },
  { key: "endpoint", header: "Endpoint", cell: (row) => <code className="text-xs text-muted-foreground">{row.endpoint}</code> },
  { key: "purpose", header: "Purpose", cell: (row) => <span className="text-sm text-muted-foreground">{row.purpose}</span> },
  { key: "authRule", header: "Auth Rule", cell: (row) => <span className="text-sm text-muted-foreground">{row.authRule}</span> },
  { key: "responseShape", header: "Response", cell: (row) => <code className="text-xs text-muted-foreground">{row.responseShape}</code> },
  { key: "blockedBy", header: "Blocked By", cell: (row) => <span className="text-sm text-muted-foreground">{row.blockedBy}</span> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const schemaColumns: DataTableColumn<AdminSchemaCandidate>[] = [
  { key: "model", header: "Model", cell: (row) => <span className="font-medium text-foreground">{row.model}</span> },
  { key: "reason", header: "Reason", cell: (row) => <span className="text-sm text-muted-foreground">{row.reason}</span> },
  { key: "candidateFields", header: "Candidate Fields", cell: (row) => <code className="text-xs text-muted-foreground">{row.candidateFields}</code> },
  { key: "promoteWhen", header: "Promote When", cell: (row) => <span className="text-sm text-muted-foreground">{row.promoteWhen}</span> },
  { key: "risk", header: "Risk", cell: (row) => <StatusPill tone={tone(row.risk)}>{row.risk}</StatusPill> },
  { key: "status", header: "Status", cell: (row) => <StatusPill tone={tone(row.status)}>{row.status}</StatusPill> },
];

const escalationColumns: DataTableColumn<AdminEscalationRow>[] = [
  { key: "scenario", header: "Scenario", cell: (row) => <span className="font-medium text-foreground">{row.scenario}</span> },
  { key: "firstOwner", header: "First Owner", cell: (row) => row.firstOwner },
  { key: "escalationOwner", header: "Escalation", cell: (row) => row.escalationOwner },
  { key: "maxAction", header: "Max Action", cell: (row) => <span className="text-sm text-muted-foreground">{row.maxAction}</span> },
  { key: "auditRequirement", header: "Audit", cell: (row) => <span className="text-sm text-muted-foreground">{row.auditRequirement}</span> },
];

const roleIcons = {
  SUPER_ADMIN: Crown,
  BILLING_ADMIN: BadgeDollarSign,
  SUPPORT_OPS_ADMIN: LifeBuoy,
};

export function AdminRoleOperationsBoard() {
  const summary = getAdminRoleSummary();

  return (
    <>
      <DashboardPanel title="Admin Role Operations Center" description="Mock-only board untuk memisahkan kebutuhan Super Admin, Billing Admin, dan Support/Ops Admin. Ini governance internal, bukan dashboard tenant biasa.">
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Admin Roles" value={summary.totalRoles} note="Super, billing, support/ops." icon={UserCog} tone="slate" />
          <StatCard label="High Risk Roles" value={summary.highRiskRoles} note="Perlu audit dan approval." icon={ShieldCheck} tone="rose" />
          <StatCard label="Feature Gaps" value={summary.featureGaps} note="Dashboard/API belum real." icon={ClipboardList} tone="amber" />
          <StatCard label="Blocked Items" value={summary.blockedItems} note="Tahan sampai guardrail siap." icon={LockKeyhole} tone="rose" />
        </div>
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-3">
        {adminRoleCards.map((role) => {
          const Icon = roleIcons[role.id];
          return (
            <DashboardPanel key={role.id} title={role.label} description={role.mission}>
              <div className="space-y-4 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                  <div className="flex gap-2">
                    <StatusPill tone={tone(role.readiness)}>{role.readiness}</StatusPill>
                    <StatusPill tone={tone(role.risk)}>{role.risk}</StatusPill>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Allowed scope</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{role.allowedScope}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Blocked scope</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{role.blockedScope}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">{role.dailyFocus}</div>
              </div>
            </DashboardPanel>
          );
        })}
      </div>

      <DashboardPanel title="Admin Permission Matrix" description="Batas akses per role. Tujuannya: jangan semua admin punya akses seperti pemilik semesta mini.">
        <DataTable columns={permissionColumns} data={adminPermissionMatrix} getRowKey={(row) => row.id} minWidth={1500} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Missing Admin Features" description="Fitur yang belum ada dan perlu disiapkan sebelum admin role benar-benar dipakai di production.">
        <DataTable columns={featureColumns} data={adminFeatureGaps} getRowKey={(row) => row.id} minWidth={1900} pagination={false} />
      </DashboardPanel>

      <DashboardPanel title="Admin API Contract Preparation" description="Kontrak awal untuk API internal admin. Belum ada handler/backend, hanya planning agar implementasi nanti tidak asal return JSON liar.">
        <DataTable columns={apiColumns} data={adminApiContracts} getRowKey={(row) => row.id} minWidth={1900} pagination={false} />
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardPanel title="Admin Schema Candidates" description="Kandidat model Prisma nanti. Belum masuk schema, karena migrasi tanpa kebutuhan real itu komedi mahal.">
          <DataTable columns={schemaColumns} data={adminSchemaCandidates} getRowKey={(row) => row.id} minWidth={1900} pagination={false} />
        </DashboardPanel>

        <DashboardPanel title="Admin Escalation Flow" description="Siapa yang handle duluan, siapa yang approve, dan aksi maksimum tiap role.">
          <DataTable columns={escalationColumns} data={adminEscalationRows} getRowKey={(row) => row.id} minWidth={1450} pagination={false} />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Admin Role Promotion Rule" description="Aturan sebelum mock role ini naik jadi backend dan schema asli.">
        <div className="grid gap-3 p-4 md:grid-cols-3">
          {[
            [Route, "Read-only first", "Mulai dari GET role, billing overview, support tickets, dan audit log sebelum mutation."],
            [ShieldCheck, "RBAC before action", "Setiap POST/PATCH butuh role guard, audit write, approval policy, dan dry-run mode."],
            [LockKeyhole, "No privilege shortcut", "Billing dan support tidak boleh assign role, toggle feature flags, atau mutate tenant security."],
          ].map(([Icon, title, note]) => {
            const TypedIcon = Icon as typeof Route;
            return (
              <article key={String(title)} className="rounded-lg border border-border bg-card p-4">
                <TypedIcon className="mb-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <p className="font-semibold text-foreground">{title as string}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{note as string}</p>
              </article>
            );
          })}
        </div>
      </DashboardPanel>
    </>
  );
}
