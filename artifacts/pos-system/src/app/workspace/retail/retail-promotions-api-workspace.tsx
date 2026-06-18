import { useState } from "react";

import { BadgePercent, Calendar, RefreshCw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { retailApi, type RetailApiPromotion } from "@/lib/api/retail-api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function getPromotionStatus(promo: RetailApiPromotion) {
  const now = Date.now();
  const starts = new Date(promo.startsAt).getTime();
  const ends = new Date(promo.endsAt).getTime();
  if (!promo.isActive) return { label: "inactive", tone: "border-neutral-200 bg-neutral-50 text-neutral-600" };
  if (now < starts) return { label: "scheduled", tone: "border-blue-200 bg-blue-50 text-blue-700" };
  if (now > ends) return { label: "expired", tone: "border-neutral-200 bg-neutral-50 text-neutral-400" };
  return { label: "live", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" };
}

export function RetailPromotionsApiWorkspace() {
  const queryClient = useQueryClient();
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [lastToggled, setLastToggled] = useState<string | null>(null);

  const { data: promotions = [], isLoading, refetch } = useQuery({
    queryKey: ["retail-promotions"],
    queryFn: () => retailApi.listPromotions(),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => retailApi.togglePromotion(id),
    onSuccess: (data) => {
      setLastToggled(`Promotion ${data.isActive ? "activated" : "deactivated"}.`);
      setToggleError(null);
      queryClient.invalidateQueries({ queryKey: ["retail-promotions"] });
    },
    onError: (err) => {
      setToggleError(err instanceof Error ? err.message : "Toggle failed.");
      setLastToggled(null);
    },
  });

  const active = promotions.filter((p) => p.isActive).length;
  const inactive = promotions.length - active;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total promotions", value: String(promotions.length), tone: "border-neutral-200 bg-neutral-50 text-neutral-700" },
          { label: "Active", value: String(active), tone: "border-emerald-200 bg-emerald-50 text-emerald-700" },
          { label: "Inactive", value: String(inactive), tone: "border-neutral-200 bg-neutral-50 text-neutral-500" },
        ].map(({ label, value, tone }) => (
          <Card key={label} className="rounded-xl bg-white">
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <p className="text-2xl font-bold text-neutral-950">{value}</p>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className={tone}>{label}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {lastToggled ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {lastToggled}
        </div>
      ) : null}
      {toggleError ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {toggleError}
        </div>
      ) : null}

      <Card className="rounded-xl bg-white">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BadgePercent className="h-5 w-5" aria-hidden="true" />
                Promotion rules
              </CardTitle>
              <CardDescription>
                {isLoading ? "Loading…" : `${promotions.length} promotions. MANAGER+ can toggle active state.`}
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {promotions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
              No promotions found. Run the retail seed script to create demo promotions.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {promotions.map((promo) => {
                const status = getPromotionStatus(promo);
                return (
                  <div key={promo.id} className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-neutral-950">{promo.name}</p>
                        {promo.targetCategory ? (
                          <p className="mt-0.5 text-xs text-neutral-500">{promo.targetCategory}</p>
                        ) : null}
                      </div>
                      <Badge variant="outline" className={status.tone}>{status.label}</Badge>
                    </div>

                    {promo.description ? (
                      <p className="text-sm leading-6 text-neutral-600">{promo.description}</p>
                    ) : null}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-lg border border-neutral-100 bg-white p-2">
                        <p className="text-xs text-neutral-400">Discount</p>
                        <p className="mt-0.5 text-lg font-bold text-neutral-950">{promo.discountPercent}%</p>
                      </div>
                      <div className="rounded-lg border border-neutral-100 bg-white p-2">
                        <p className="text-xs text-neutral-400">State</p>
                        <p className={`mt-0.5 text-sm font-semibold ${promo.isActive ? "text-emerald-700" : "text-neutral-500"}`}>
                          {promo.isActive ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {formatDate(promo.startsAt)} → {formatDate(promo.endsAt)}
                    </div>

                    <button
                      type="button"
                      disabled={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate(promo.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        promo.isActive
                          ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                          : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {promo.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
