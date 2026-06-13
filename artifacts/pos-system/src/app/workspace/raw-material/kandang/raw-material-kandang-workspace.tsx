import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  Factory,
  PackageSearch,
  Sprout,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";

const futureSections = [
  {
    title: "Pen/Kandang list",
    description:
      "Planned overview for pen identity, capacity, health notes, and occupancy status.",
    icon: Factory,
  },
  {
    title: "Livestock/batch tracking",
    description:
      "Planned relation between animal groups, intake batches, age, weight, and movement history.",
    icon: ClipboardList,
  },
  {
    title: "Feed usage",
    description:
      "Planned tracking surface for feed allocation, consumption notes, and cost relation.",
    icon: Sprout,
  },
  {
    title: "Mortality/events",
    description:
      "Planned event log for mortality, health incidents, transfers, and operational notes.",
    icon: AlertTriangle,
  },
  {
    title: "Supplier/source relation",
    description:
      "Planned link from livestock groups back to suppliers, farms, intake source, and documents.",
    icon: PackageSearch,
  },
  {
    title: "Stock/inventory relation",
    description:
      "Planned connection between kandang state, inventory movement, feed stock, and output batches.",
    icon: Boxes,
  },
] as const;

export default function RawMaterialKandangWorkspace() {
  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-dashed border-amber-300 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-amber-300 text-amber-700">
            Planned Raw Material workspace
          </Badge>
          <Badge variant="outline" className="border-neutral-300 text-neutral-600">
            Preview only
          </Badge>
        </div>

        <div className="mt-5 max-w-4xl space-y-3">
          <h1 className="text-2xl font-bold text-neutral-950">
            Raw Material - Kandang Workspace
          </h1>
          <p className="text-sm leading-6 text-neutral-600">
            Foundation route for the future Kandang workspace at{" "}
            <span className="font-semibold text-neutral-900">
              {ROUTES.V3_RAW_MATERIAL_KANDANG}
            </span>
            . This screen is intentionally static and does not create backend
            records, database models, API calls, mutations, or production
            livestock workflows.
          </p>
        </div>

        <div className="mt-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
          Raw Material mode remains planned and unavailable for operational use.
          Restaurant / F&amp;B workflows continue to be the active production
          experience.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {futureSections.map((section) => {
          const Icon = section.icon;

          return (
            <Card key={section.title} className="rounded-lg bg-white">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
                    <Icon className="h-5 w-5 text-neutral-700" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Future concept
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-neutral-600">
                  {section.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
