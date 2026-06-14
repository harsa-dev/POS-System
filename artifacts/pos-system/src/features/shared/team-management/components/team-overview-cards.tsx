import { BriefcaseBusiness, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

import { MiniStat } from "./team-management-ui";

export function TeamOverviewCards({
  lockedRoleCount,
  jobPresetCount,
  draftPermissionCount,
  totalPermissions,
  draftRiskCount,
  customRoleCount,
}: {
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
        label="System Roles"
        value={String(lockedRoleCount)}
        note="Default locked access model"
        icon={LockKeyhole}
        tone="slate"
      />
      <MiniStat
        label="Job Presets"
        value={String(jobPresetCount)}
        note="Restaurant, retail, raw material, custom"
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
