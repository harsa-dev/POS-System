import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Truck } from "lucide-react";

import {
  retailGetReceivingQueue,
  retailUpdateReceivingStatus,
  type RetailReceivingQueueItem,
  type RetailReceivingStatus,
} from "@workspace/api-client-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatRetailCurrency,
  getRetailSupplierName,
  retailReceivings,
} from "@/features/retail/core-system";

type ApiState = "loading" | "api" | "mock-fallback";

type StatusMutationState = {
  receivingId: string;
  status: RetailReceivingStatus;
} | null;

const statusTone: Record<RetailReceivingStatus, string> = {
  draft: "border-neutral-200 bg-neutral-50 text-neutral-600",
  ordered: "border-blue-200 bg-blue-50 text-blue-700",
  partial: "border-amber-200 bg-amber-50 text-amber-700",
  received: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const apiStateTone: Record<ApiState, string> = {
  loading: "border-blue-200 bg-blue-50 text-blue-700",
  api: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "mock-fallback": "border-amber-200 bg-amber-50 text-amber-700",
};

const nextStatuses: Record<RetailReceivingStatus, readonly RetailReceivingStatus[]> = {
  draft: ["ordered"],
  ordered: ["partial", "received"],
  partial: ["received"],
  received: [],
};

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No date";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function normalizeMockStatus(status: string): RetailReceivingStatus {
  if (status === "partially-received") return "partial";
  if (status === "received" || status === "draft" || status === "ordered" || status === "partial") {
    return status;
  }
  return "draft";
}

function getMockReceivingQueue(): RetailReceivingQueueItem[] {
  return retailReceivings.map((receiving) => ({
    id: receiving.id,
    supplierId: receiving.supplierId,
    supplierName: getRetailSupplierName(receiving.supplierId),
    status: normalizeMockStatus(receiving.status),
    expectedDate: receiving.expectedDate,
    totalCost: receiving.totalCost,
    items: receiving.items.map((item) => ({
      productId: item.productId,
      sku: item.productId,
      orderedQty: item.orderedQuantity,
      receivedQty: item.receivedQuantity,
      missingQty: Math.max(item.orderedQuantity - item.receivedQuantity, 0),
    })),
  }));
}

function getReceivingStatusLabel(status: RetailReceivingStatus) {
  if (status === "partial") return "partially received";
  return status;
}

function getFirstReceivingId(receivings: RetailReceivingQueueItem[]) {
  return receivings[0]?.id ?? "";
}

export default function RetailReceivingApiWorkspace() {
  const [receivings, setReceivings] = useState<RetailReceivingQueueItem[]>(getMockReceivingQueue);
  const [source, setSource] = useState<ApiState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [selectedReceivingId, setSelectedReceivingId] = useState(getFirstReceivingId(receivings));
  const [mutationState, setMutationState] = useState<StatusMutationState>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function loadReceivingQueue() {
    setSource("loading");
    setError(null);

    try {
      const payload = await retailGetReceivingQueue({ credentials: "include" });
      const nextReceivings = payload.data;
      const fallbackReceivings = getMockReceivingQueue();
      const visibleReceivings = nextReceivings.length > 0 ? nextReceivings : fallbackReceivings;

      setReceivings(visibleReceivings);
      setSource(nextReceivings.length > 0 ? "api" : "mock-fallback");
      setSelectedReceivingId((currentId: string) => {
        if (visibleReceivings.some((receiving: RetailReceivingQueueItem) => receiving.id === currentId)) return currentId;
        return getFirstReceivingId(visibleReceivings);
      });

      if (nextReceivings.length === 0) {
        setError("Retail API returned zero receiving rows, so the workspace is using local mock data.");
      }
    } catch (caughtError) {
      const fallbackReceivings = getMockReceivingQueue();
      setReceivings(fallbackReceivings);
      setSource("mock-fallback");
      setSelectedReceivingId((currentId: string) => {
        if (fallbackReceivings.some((receiving: RetailReceivingQueueItem) => receiving.id === currentId)) return currentId;
        return getFirstReceivingId(fallbackReceivings);
      });
      setError(caughtError instanceof Error ? caughtError.message : "Retail receiving API request failed.");
    }
  }

  useEffect(() => {
    void loadReceivingQueue();
  }, []);

  const selectedReceiving = useMemo(() => {
    return receivings.find((receiving: RetailReceivingQueueItem) => receiving.id === selectedReceivingId) ?? receivings[0] ?? null;
  }, [receivings, selectedReceivingId]);

  const statusActions = selectedReceiving ? nextStatuses[selectedReceiving.status] : [];
  const totalMissingQty = selectedReceiving?.items.reduce((total: number, item: RetailReceivingQueueItem["items"][number]) => total + item.missingQty, 0) ?? 0;
  const totalOrderedQty = selectedReceiving?.items.reduce((total: number, item: RetailReceivingQueueItem["items"][number]) => total + item.orderedQty, 0) ?? 0;
  const totalReceivedQty = selectedReceiving?.items.reduce((total: number, item: RetailReceivingQueueItem["items"][number]) => total + item.receivedQty, 0) ?? 0;

  async function updateReceivingStatus(status: RetailReceivingStatus) {
    if (!selectedReceiving || source !== "api") return;

    setMutationState({ receivingId: selectedReceiving.id, status });
    setStatusMessage(null);

    try {
      const payload = await retailUpdateReceivingStatus(
        selectedReceiving.id,
        { status },
        { credentials: "include" },
      );

      setStatusMessage(
        payload.data.updated
          ? `Receiving status updated from ${payload.data.previousStatus} to ${payload.data.status}.`
          : payload.data.reason ?? "Receiving status did not change.",
      );
      await loadReceivingQueue();
    } catch (caughtError) {
      setStatusMessage(caughtError instanceof Error ? caughtError.message : "Receiving status update failed.");
    } finally {
      setMutationState(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={apiStateTone[source]}>
            {source === "api" ? "Prisma API" : source === "loading" ? "Loading API" : "Mock fallback"}
          </Badge>
          <Badge variant="outline" className="border-blue-200 text-blue-700">
            Retail receiving workflow
          </Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Receiving reads from the Retail API and exposes guarded status transitions when the backend is available. Mock fallback stays read-only, because pretending mock writes persisted is how dashboards learn to lie.
        </p>
        {error ? <p className="mt-2 text-xs text-amber-700">Fallback reason: {error}</p> : null}
        {statusMessage ? <p className="mt-2 text-xs text-blue-700">{statusMessage}</p> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <Card className="rounded-xl bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" aria-hidden="true" />
              Receiving queue
            </CardTitle>
            <CardDescription>Select a receiving record and advance guarded workflow status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {receivings.map((receiving) => (
              <button
                type="button"
                key={receiving.id}
                onClick={() => setSelectedReceivingId(receiving.id)}
                className={classNames(
                  "w-full rounded-xl border p-3 text-left transition",
                  selectedReceiving?.id === receiving.id
                    ? "border-blue-300 bg-blue-50"
                    : "border-neutral-100 bg-white hover:bg-neutral-50",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-neutral-950">{receiving.id}</p>
                    <p className="mt-1 text-sm text-neutral-500">{receiving.supplierName}</p>
                  </div>
                  <Badge variant="outline" className={statusTone[receiving.status]}>
                    {getReceivingStatusLabel(receiving.status)}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-xl bg-white">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{selectedReceiving?.id ?? "No receiving selected"}</CardTitle>
                <CardDescription>
                  {selectedReceiving ? `${formatDate(selectedReceiving.expectedDate)} · ${selectedReceiving.supplierName}` : "No queue row."}
                </CardDescription>
              </div>
              {selectedReceiving ? (
                <Badge variant="outline" className={statusTone[selectedReceiving.status]}>
                  {getReceivingStatusLabel(selectedReceiving.status)}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 overflow-x-auto">
            {selectedReceiving ? (
              <>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                    <p className="text-sm text-neutral-400">Total cost</p>
                    <p className="mt-1 font-bold text-neutral-950">{formatRetailCurrency(selectedReceiving.totalCost)}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                    <p className="text-sm text-neutral-400">Ordered</p>
                    <p className="mt-1 font-bold text-neutral-950">{totalOrderedQty}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                    <p className="text-sm text-neutral-400">Received</p>
                    <p className="mt-1 font-bold text-neutral-950">{totalReceivedQty}</p>
                  </div>
                  <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                    <p className="text-sm text-neutral-400">Missing</p>
                    <p className="mt-1 font-bold text-neutral-950">{totalMissingQty}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-neutral-100 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">Guarded status action</p>
                      <p className="mt-1 text-sm text-neutral-500">
                        Valid transitions are enforced by backend. API fallback mode is intentionally read-only.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {statusActions.length > 0 ? (
                        statusActions.map((status) => {
                          const isPending =
                            mutationState !== null &&
                            mutationState.receivingId === selectedReceiving.id &&
                            mutationState.status === status;

                          return (
                            <button
                              key={status}
                              type="button"
                              disabled={source !== "api" || Boolean(mutationState)}
                              onClick={() => updateReceivingStatus(status)}
                              className="rounded-lg bg-neutral-950 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
                            >
                              {isPending ? "Updating..." : `Mark ${getReceivingStatusLabel(status)}`}
                            </button>
                          );
                        })
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Final status
                        </span>
                      )}
                    </div>
                  </div>
                  {source !== "api" ? (
                    <p className="mt-3 flex items-center gap-2 text-xs text-amber-700">
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                      Actions are disabled while using mock fallback.
                    </p>
                  ) : null}
                </div>

                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b text-xs uppercase tracking-[0.12em] text-neutral-400">
                    <tr>
                      <th className="py-3 pr-4">SKU</th>
                      <th className="py-3 pr-4">Ordered</th>
                      <th className="py-3 pr-4">Received</th>
                      <th className="py-3 pr-4">Missing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedReceiving.items.map((item: RetailReceivingQueueItem["items"][number]) => (
                      <tr key={`${selectedReceiving.id}:${item.productId}`}>
                        <td className="py-3 pr-4 font-mono text-xs text-neutral-600">{item.sku}</td>
                        <td className="py-3 pr-4 text-neutral-700">{item.orderedQty}</td>
                        <td className="py-3 pr-4 text-neutral-700">{item.receivedQty}</td>
                        <td className="py-3 pr-4 font-semibold text-neutral-950">{item.missingQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                No receiving queue row available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
