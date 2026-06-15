import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  RawMaterialBusinessScale,
  RawMaterialScaleFeature,
  RawMaterialScaleFeatureStatus,
  RawMaterialScaleProfile,
} from "@/features/raw-material/core-system";

type RawMaterialScaleDashboardProps = {
  profiles: readonly RawMaterialScaleProfile[];
  features: readonly RawMaterialScaleFeature[];
};

type ScaleFilterValue = RawMaterialBusinessScale | "all";

const scaleTone: Record<RawMaterialBusinessScale, string> = {
  small: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  factory: "border-blue-200 bg-blue-50 text-blue-700",
};

const statusLabel: Record<RawMaterialScaleFeatureStatus, string> = {
  available: "already covered",
  "planning-preview": "planning preview",
  "future-production": "future production",
};

const statusTone: Record<RawMaterialScaleFeatureStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "planning-preview": "border-amber-200 bg-amber-50 text-amber-700",
  "future-production": "border-blue-200 bg-blue-50 text-blue-700",
};

const scaleFilterOptions: readonly { label: string; value: ScaleFilterValue }[] = [
  { label: "All scale", value: "all" },
  { label: "Kecil", value: "small" },
  { label: "Menengah", value: "medium" },
  { label: "Factory", value: "factory" },
];

const displayStatusOverride: Record<string, RawMaterialScaleFeatureStatus> = {
  "rmsf-medium-003": "available",
  "rmsf-factory-001": "future-production",
  "rmsf-factory-002": "future-production",
  "rmsf-factory-003": "future-production",
  "rmsf-factory-004": "future-production",
};

const statusReason: Record<RawMaterialScaleFeatureStatus, string> = {
  available: "Covered by the current sample workspace, but still needs production-grade persistence later.",
  "planning-preview": "Safe to show now as frontend-only portfolio scope without database commitment.",
  "future-production": "Needs real schema, API, permission, audit, or background-job design before implementation.",
};

function getFeatureDisplayStatus(feature: RawMaterialScaleFeature): RawMaterialScaleFeatureStatus {
  return displayStatusOverride[feature.id] ?? feature.status;
}

function countFeaturesByStatus(
  features: readonly RawMaterialScaleFeature[],
  status: RawMaterialScaleFeatureStatus,
) {
  return features.filter((feature) => getFeatureDisplayStatus(feature) === status).length;
}

function filterProfilesByScale(
  profiles: readonly RawMaterialScaleProfile[],
  scaleFilter: ScaleFilterValue,
) {
  return scaleFilter === "all"
    ? profiles
    : profiles.filter((profile) => profile.scale === scaleFilter);
}

function filterFeaturesByScale(
  features: readonly RawMaterialScaleFeature[],
  scaleFilter: ScaleFilterValue,
) {
  return scaleFilter === "all"
    ? features
    : features.filter((feature) => feature.scale === scaleFilter);
}

export function RawMaterialScaleDashboard({
  profiles,
  features,
}: RawMaterialScaleDashboardProps) {
  const [scaleFilter, setScaleFilter] = useState<ScaleFilterValue>("all");
  const visibleProfiles = filterProfilesByScale(profiles, scaleFilter);
  const visibleFeatures = filterFeaturesByScale(features, scaleFilter);
  const availableCount = countFeaturesByStatus(visibleFeatures, "available");
  const planningPreviewCount = countFeaturesByStatus(visibleFeatures, "planning-preview");
  const futureProductionCount = countFeaturesByStatus(visibleFeatures, "future-production");

  return (
    <Card className="rounded-xl bg-white">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Scale-based feature dashboard</CardTitle>
            <CardDescription>
              Planning roadmap for raw material and kandang needs across small, medium, and factory-scale operations.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-blue-200 text-blue-700">
            planning preview
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2 rounded-xl border border-neutral-100 bg-neutral-50 p-2">
          {scaleFilterOptions.map((option) => {
            const isSelected = scaleFilter === option.value;

            return (
              <Button
                key={option.value}
                type="button"
                size="sm"
                variant={isSelected ? "default" : "outline"}
                onClick={() => setScaleFilter(option.value)}
              >
                {option.label}
              </Button>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
            <p className="text-sm text-neutral-500">Already covered</p>
            <p className="mt-1 text-2xl font-bold text-neutral-950">{availableCount}</p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">Existing workspace capabilities that already cover selected scale needs.</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">Planning previews</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{planningPreviewCount}</p>
            <p className="mt-1 text-xs leading-5 text-amber-800">Safe frontend-only feature panels added before schema work.</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Future production work</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{futureProductionCount}</p>
            <p className="mt-1 text-xs leading-5 text-blue-800">Items that should become real models, APIs, or background jobs later.</p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {visibleProfiles.map((profile) => (
            <div key={profile.scale} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-neutral-950">{profile.label}</h3>
                <Badge variant="outline" className={scaleTone[profile.scale]}>
                  {profile.scale}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{profile.businessShape}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                {profile.operatingStyle}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{profile.dashboardGoal}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.mustHaveFocus.map((focus) => (
                  <Badge key={focus} variant="outline" className="border-neutral-200 text-neutral-600">
                    {focus}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-3">
          {visibleProfiles.map((profile) => {
            const scaleFeatures = visibleFeatures.filter((feature) => feature.scale === profile.scale);

            return (
              <div key={profile.scale} className="rounded-xl border border-neutral-100 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-neutral-950">{profile.label} features</h3>
                  <Badge variant="outline" className={scaleTone[profile.scale]}>
                    {scaleFeatures.length} items
                  </Badge>
                </div>
                <div className="space-y-3">
                  {scaleFeatures.map((feature) => {
                    const displayStatus = getFeatureDisplayStatus(feature);

                    return (
                      <div key={feature.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-neutral-900">{feature.title}</p>
                          <Badge variant="outline" className={statusTone[displayStatus]}>
                            {statusLabel[displayStatus]}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-400">
                          {feature.dashboardArea}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-neutral-600">{feature.purpose}</p>
                        <p className="mt-2 rounded-lg border border-amber-100 bg-amber-50 p-2 text-xs leading-5 text-amber-800">
                          {feature.whyItMatters}
                        </p>
                        <p className="mt-2 rounded-lg border border-neutral-100 bg-white p-2 text-xs leading-5 text-neutral-600">
                          {statusReason[displayStatus]}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-neutral-700">Preview metric: {feature.previewMetric}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
