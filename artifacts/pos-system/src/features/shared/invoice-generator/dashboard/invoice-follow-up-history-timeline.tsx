"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, History, RefreshCw } from "lucide-react";

import {
  invoiceApi,
  type InvoiceFollowUpDto,
  type InvoiceFollowUpStatus,
} from "@/lib/api/invoice-api";
import { DashboardActionButton } from "@/features/shared/dashboard";

const STATUS_LABELS: Record<InvoiceFollowUpStatus, string> = {
  CONTACTED: "Contacted",
  WAITING_RESPONSE: "Waiting response",
  PROMISED_PAYMENT: "Promised payment",
  RESOLVED: "Resolved",
  ESCALATED: "Escalated",
};

type InvoiceFollowUpHistoryTimelineProps = {
  invoiceId: string | null;
  invoiceNumber?: string | null;
  reloadSignal?: number;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "No date";
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InvoiceFollowUpHistoryTimeline({
  invoiceId,
  invoiceNumber,
  reloadSignal = 0,
}: InvoiceFollowUpHistoryTimelineProps) {
  const [records, setRecords] = useState<InvoiceFollowUpDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!invoiceId) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await invoiceApi.listInvoiceFollowUps(invoiceId);
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to load follow-up history.");
        setRecords([]);
        return;
      }

      setRecords(response.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load follow-up history.");
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, reloadSignal]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-neutral-950">
            <History className="h-4 w-4 text-blue-600" />
            Follow-Up History
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            {invoiceNumber ? `All notes for ${invoiceNumber}.` : "Select an overdue invoice to inspect its follow-up timeline."}
          </p>
        </div>
        <DashboardActionButton icon={RefreshCw} onClick={() => void loadHistory()} disabled={!invoiceId || isLoading}>
          {isLoading ? "Loading..." : "Refresh"}
        </DashboardActionButton>
      </div>

      {errorMessage && <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{errorMessage}</p>}

      <div className="mt-4 space-y-3">
        {records.map((record) => (
          <div key={record.id} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                {STATUS_LABELS[record.status]}
              </span>
              <span className="text-xs text-neutral-500">{formatDateTime(record.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">{record.note}</p>
            {record.nextFollowUpAt && (
              <div className="mt-2 flex items-center gap-2 text-xs font-medium text-amber-700">
                <CalendarClock className="h-3.5 w-3.5" />
                Next follow-up: {formatDateTime(record.nextFollowUpAt)}
              </div>
            )}
          </div>
        ))}

        {!isLoading && records.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
            No follow-up history yet. The latest-note section above is lonely, apparently.
          </p>
        )}
      </div>
    </div>
  );
}
