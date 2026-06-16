"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Download, FileJson, RefreshCw } from "lucide-react";

import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
} from "@/features/shared/dashboard";
import { StatCard, StatusPill } from "@/features/shared/cards";
import { formatNumber } from "@/features/shared/format";
import { getApiErrorMessage } from "@/lib/api/api-client";
import {
  shiftsApi,
  type CashierShiftSyncAttemptDto,
  type CashierShiftSyncAttemptHistoryDto,
  type CashierShiftSyncAttemptStatus,
} from "@/lib/api/shifts-api";

type CashierShiftSyncAttemptHistoryPanelProps = {
  selectedShiftId: string | null;
  selectedCashierName?: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getAttemptTone(status: CashierShiftSyncAttemptStatus) {
  if (status === "SUCCESS") return "green";
  if (status === "FAILED") return "rose";
  return "blue";
}

function downloadJsonFile(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function renderAttemptError(attempt: CashierShiftSyncAttemptDto) {
  if (attempt.status !== "FAILED") return "-";

  return attempt.errorMessage ?? attempt.errorCode ?? "Unknown sync error";
}

export function CashierShiftSyncAttemptHistoryPanel({
  selectedShiftId,
  selectedCashierName,
}: CashierShiftSyncAttemptHistoryPanelProps) {
  const [history, setHistory] = useState<CashierShiftSyncAttemptHistoryDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState<"csv" | "json" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!selectedShiftId) {
      setHistory(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await shiftsApi.getSyncAttemptHistory(selectedShiftId, 100);
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to load shift sync attempt history.");
        return;
      }

      setHistory(response.data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to load shift sync attempt history."));
    } finally {
      setIsLoading(false);
    }
  }, [selectedShiftId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const attempts = history?.attempts ?? [];
  const latestAttempt = attempts[0] ?? null;
  const latestCopy = useMemo(() => {
    if (!latestAttempt) return "No attempts recorded yet.";
    if (latestAttempt.status === "FAILED") {
      return `Attempt #${latestAttempt.attemptNumber} failed: ${latestAttempt.errorMessage ?? "Unknown error"}`;
    }
    if (latestAttempt.status === "SUCCESS") {
      return `Attempt #${latestAttempt.attemptNumber} succeeded.`;
    }
    return `Attempt #${latestAttempt.attemptNumber} is still running.`;
  }, [latestAttempt]);

  async function handleExportCsv() {
    if (!selectedShiftId) return;

    setIsExporting("csv");
    setMessage(null);
    setErrorMessage(null);

    try {
      const result = await shiftsApi.downloadSyncAttemptHistoryCsv(selectedShiftId, 500);
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage(`Exported ${formatNumber(result.rowCount ?? 0)} sync attempt row(s).`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to export shift sync attempts."));
    } finally {
      setIsExporting(null);
    }
  }

  async function handleExportJson() {
    if (!selectedShiftId) return;

    setIsExporting("json");
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await shiftsApi.exportSyncAttemptHistoryJson(selectedShiftId, 500);
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to export shift sync attempts as JSON.");
        return;
      }

      downloadJsonFile(
        `cashier-shift-sync-attempts-${selectedShiftId.slice(0, 8)}.json`,
        response.data,
      );
      setMessage(`Exported ${formatNumber(response.data.meta.rowCount)} sync attempt row(s).`);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Failed to export shift sync attempts as JSON."));
    } finally {
      setIsExporting(null);
    }
  }

  return (
    <DashboardPanel
      title="Sync Attempt History"
      description="Open a cashier shift from reconciliation to inspect every cashflow sync retry, error message, actor role, and exportable audit trail. Latest-only error cards were cute; this is actual history."
    >
      <div className="space-y-4 p-4">
        {!selectedShiftId ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-600">
            Select a shift from the reconciliation table to inspect its sync attempt history.
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1 text-sm text-neutral-600">
                <p className="font-semibold text-neutral-950">
                  Shift {selectedShiftId.slice(0, 8)} {selectedCashierName ? `· ${selectedCashierName}` : ""}
                </p>
                <p>{latestCopy}</p>
                {message && <p className="text-blue-700">{message}</p>}
                {errorMessage && <p className="text-rose-700">{errorMessage}</p>}
              </div>
              <DashboardActions>
                <DashboardActionButton
                  icon={RefreshCw}
                  onClick={() => void loadHistory()}
                  disabled={isLoading || Boolean(isExporting)}
                >
                  {isLoading ? "Refreshing..." : "Refresh"}
                </DashboardActionButton>
                <DashboardActionButton
                  icon={Download}
                  onClick={() => void handleExportCsv()}
                  disabled={isLoading || Boolean(isExporting) || attempts.length === 0}
                >
                  {isExporting === "csv" ? "Exporting..." : "Export CSV"}
                </DashboardActionButton>
                <DashboardActionButton
                  icon={FileJson}
                  onClick={() => void handleExportJson()}
                  disabled={isLoading || Boolean(isExporting) || attempts.length === 0}
                >
                  {isExporting === "json" ? "Exporting..." : "Export JSON"}
                </DashboardActionButton>
              </DashboardActions>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={Clock3}
                label="Total Attempts"
                value={formatNumber(history?.summary.totalAttempts ?? 0)}
                tone="slate"
              />
              <StatCard
                icon={CheckCircle2}
                label="Succeeded"
                value={formatNumber(history?.summary.successCount ?? 0)}
                tone="green"
              />
              <StatCard
                icon={AlertTriangle}
                label="Failed"
                value={formatNumber(history?.summary.failedCount ?? 0)}
                tone="rose"
              />
              <StatCard
                icon={RefreshCw}
                label="Running"
                value={formatNumber(history?.summary.runningCount ?? 0)}
                tone="blue"
              />
            </div>

            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="min-w-[1040px] divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Attempt</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Error</th>
                    <th className="px-4 py-3">Cashflow Entry</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                        Loading sync attempt history...
                      </td>
                    </tr>
                  ) : attempts.length > 0 ? (
                    attempts.map((attempt) => (
                      <tr key={attempt.id}>
                        <td className="px-4 py-3 font-semibold text-neutral-950">
                          #{attempt.attemptNumber}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill tone={getAttemptTone(attempt.status)}>{attempt.status}</StatusPill>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-[320px] text-neutral-600">{renderAttemptError(attempt)}</div>
                          {attempt.errorCode && (
                            <div className="text-xs text-neutral-500">Code: {attempt.errorCode}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {attempt.cashflowEntryId ? attempt.cashflowEntryId.slice(0, 8) : "-"}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          <div>{attempt.actorRole ?? "Unknown role"}</div>
                          <div className="text-xs text-neutral-500">
                            {attempt.actorId ? attempt.actorId.slice(0, 8) : "No actor"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">{formatDateTime(attempt.createdAt)}</td>
                        <td className="px-4 py-3 text-neutral-600">{formatDateTime(attempt.updatedAt)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                        No sync attempts recorded for this shift yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </DashboardPanel>
  );
}
