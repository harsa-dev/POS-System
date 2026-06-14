import { BriefcaseBusiness, KeyRound, LockKeyhole, ShieldCheck, Users } from "lucide-react";

import { MiniStat } from "./team-management-ui";

export function TeamOverviewCards({
  totalMemberCount,
  activeMemberCount,
  pendingMemberCount,
  suspendedMemberCount,
  lockedRoleCount,
  jobPresetCount,
  draftPermissionCount,
  totalPermissions,
  draftRiskCount,
  customRoleCount,
}: {
  totalMemberCount: number;
  activeMemberCount: number;
  pendingMemberCount: number;
  suspendedMemberCount: number;
  lockedRoleCount: number;
  jobPresetCount: number;
  draftPermissionCount: number;
  totalPermissions: number;
  draftRiskCount: number;
  customRoleCount: number;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MiniStat
        label="Members"
        value={String(totalMemberCount)}
        note={`${activeMemberCount} active · ${pendingMemberCount} pending · ${suspendedMemberCount} suspended`}
        icon={Users}
        tone={suspendedMemberCount > 0 ? "rose" : pendingMemberCount > 0 ? "amber" : "green"}
      />
      <MiniStat
        label="System Roles"
        value={String(lockedRoleCount)}
        note="Default locked access model"
        icon={LockKeyhole}
        tone="slate"
      />
      <MiniStat
        label="Job Presets"
        value={String(jobPresetCount)}
        note={`Custom roles: ${customRoleCount}`}
        icon={BriefcaseBusiness}
        tone="blue"
      />
      <MiniStat
        label="Granted Actions"
        value={`${draftPermissionCount}/${totalPermissions}`}
        note={`${draftRiskCount} elevated/destructive in draft`}
        icon={KeyRound}
        tone={draftRiskCount > 5 ? "rose" : "green"}
      />
      <MiniStat
        label="Custom Roles"
        value={String(customRoleCount)}
        note="Persisted in localStorage dummy"
        icon={ShieldCheck}
        tone="amber"
      />
    </div>
  );
}
