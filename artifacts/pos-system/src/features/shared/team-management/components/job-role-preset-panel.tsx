import { Search } from "lucide-react";

import { StatusPill } from "@/features/shared/cards";
import { DashboardPanel } from "@/features/shared/dashboard";

import {
  getJobRoleCountBySector,
  sectorLabels,
  type BusinessRoleSector,
  type JobRoleProfile,
} from "../job-role-library";
import { countRiskyPermissions } from "../role-permission-library";

export function JobRolePresetPanel({
  sectors,
  selectedSector,
  selectedJobId,
  jobQuery,
  filteredJobRoles,
  onSectorChange,
  onJobQueryChange,
  onApplyJobPreset,
}: {
  sectors: BusinessRoleSector[];
  selectedSector: BusinessRoleSector;
  selectedJobId: string;
  jobQuery: string;
  filteredJobRoles: JobRoleProfile[];
  onSectorChange: (sector: BusinessRoleSector) => void;
  onJobQueryChange: (query: string) => void;
  onApplyJobPreset: (jobId: string) => void;
}) {
  return (
    <DashboardPanel
      title="Real-world Job Role Library"
      description="Pick a real-world job profile, then convert it into system role + permission preset. Tidak lagi role karangan kabut."
    >
      <div className="grid gap-4 p-4">
        <div className="grid gap-2 sm:grid-cols-4">
          {sectors.map((sector) => (
            <button
              key={sector}
              type="button"
              onClick={() => onSectorChange(sector)}
              className={[
                "rounded-2xl border p-3 text-left transition",
                selectedSector === sector
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-muted/30",
              ].join(" ")}
            >
              <p className="text-sm font-semibold text-foreground">{sectorLabels[sector]}</p>
              <p className="mt-1 text-xs text-muted-foreground">{getJobRoleCountBySector(sector)} presets</p>
            </button>
          ))}
        </div>

        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={jobQuery}
            onChange={(event) => onJobQueryChange(event.target.value)}
            placeholder="Search job title, department, alias..."
            className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none ring-primary/20 transition focus:ring-4"
          />
        </label>

        <div className="grid max-h-[620px] gap-3 overflow-auto">
          {filteredJobRoles.map((job) => {
            const selected = selectedJobId === job.id;
            const risk = countRiskyPermissions(job.recommendedPermissions);

            return (
              <button
                key={job.id}
                type="button"
                onClick={() => onApplyJobPreset(job.id)}
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  selected ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/30",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{job.title}</p>
                      <StatusPill tone="slate">{job.baseRole}</StatusPill>
                      <StatusPill tone="blue">{job.department}</StatusPill>
                      {risk > 0 && <StatusPill tone="amber">{risk} risk</StatusPill>}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{job.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.aliases.slice(0, 4).map((alias) => (
                    <span key={alias} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      {alias}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </DashboardPanel>
  );
}
