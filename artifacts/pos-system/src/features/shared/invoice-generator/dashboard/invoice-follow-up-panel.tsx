"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, ClipboardList, FileInput, RefreshCw } from "lucide-react";

import {
  invoiceApi,
  type InvoiceFollowUpDashboardDto,
  type InvoiceFollowUpDashboardItemDto,
  type InvoiceFollowUpPayload,
  type InvoiceFollowUpStatus,
} from "@/lib/api/invoice-api";
import { formatCurrency } from "@/features/shared/format";
import { DashboardActionButton, DashboardActions, DashboardPanel, StatCard } from "@/features/shared/dashboard";
import {
  INVOICE_GENERATOR_LOAD_INVOICE_EVENT,
  INVOICE_GENERATOR_OPEN_FOLLOW_UP_EVENT,
  type InvoiceGeneratorLoadInvoiceEventDetail,
  type InvoiceGeneratorOpenFollowUpEventDetail,
} from "./invoice-generator-events";
import { InvoiceFollowUpHistoryTimeline } from "./invoice-follow-up-history-timeline";

type InvoiceFollowUpPanelProps = {
  canManage: boolean;
  reloadSignal?: number;
};

const FOLLOW_UP_STATUS_OPTIONS: Array<{ value: InvoiceFollowUpStatus; label: string }> = [
  { value: "CONTACTED", label: "Contacted" },
  { value: "WAITING_RESPONSE", label: "Waiting response" },
  { value: "PROMISED_PAYMENT", label: "Promised payment" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "ESCALATED", label: "Escalated" },
];

const STATUS_LABELS: Record<InvoiceFollowUpStatus, string> = {
  CONTACTED: "Contacted",
  WAITING_RESPONSE: "Waiting response",
  PROMISED_PAYMENT: "Promised payment",
  RESOLVED: "Resolved",
  ESCALATED: "Escalated",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function loadInvoiceToEditor(invoice: InvoiceFollowUpDashboardItemDto["invoice"]) {
  const detail: InvoiceGeneratorLoadInvoiceEventDetail = {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
  };
  window.dispatchEvent(new CustomEvent(INVOICE_GENERATOR_LOAD_INVOICE_EVENT, { detail }));
  document.getElementById("invoice-generator-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getInitialForm(selected: InvoiceFollowUpDashboardItemDto | null): InvoiceFollowUpPayload {
  return {
    status: selected?.latestFollowUp?.status ?? "CONTACTED",
    note: selected?.latestFollowUp?.note ?? "",
    nextFollowUpAt: selected?.latestFollowUp?.nextFollowUpAt?.slice(0, 16) ?? "",
  };
}

export function InvoiceFollowUpPanel({ canManage, reloadSignal = 0 }: InvoiceFollowUpPanelProps) {
  const [dashboard, setDashboard] = useState<InvoiceFollowUpDashboardDto | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceFollowUpPayload>({ status: "CONTACTED", note: "", nextFollowUpAt: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [historyReloadKey, setHistoryReloadKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const items = dashboard?.items ?? [];
  const selectedItem = useMemo(
    () => items.find((item) => item.invoice.id === selectedInvoiceId) ?? items[0] ?? null,
    [items, selectedInvoiceId],
  );

  async function loadFollowUps(preferredInvoiceId?: string) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await invoiceApi.getFollowUpDashboard();
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to load invoice follow-ups.");
        return;
      }
      setDashboard(response.data);
      setSelectedInvoiceId((current) => {
        if (preferredInvoiceId && response.data.items.some((item) => item.invoice.id === preferredInvoiceId)) {
          return preferredInvoiceId;
        }
        if (current && response.data.items.some((item) => item.invoice.id === current)) return current;
        return response.data.items[0]?.invoice.id ?? null;
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load invoice follow-ups.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadFollowUps();
  }, [reloadSignal]);

  useEffect(() => {
    function handleOpenFollowUp(event: Event) {
      const customEvent = event as CustomEvent<InvoiceGeneratorOpenFollowUpEventDetail>;
      const invoiceId = customEvent.detail?.invoiceId;
      if (!invoiceId) return;
      setSelectedInvoiceId(invoiceId);
      void loadFollowUps(invoiceId);
      document.getElementById("invoice-follow-up-tracker")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.addEventListener(INVOICE_GENERATOR_OPEN_FOLLOW_UP_EVENT, handleOpenFollowUp);
    return () => window.removeEventListener(INVOICE_GENERATOR_OPEN_FOLLOW_UP_EVENT, handleOpenFollowUp);
  }, []);

  useEffect(() => {
    setForm(getInitialForm(selectedItem));
    setMessage(null);
    setErrorMessage(null);
  }, [selectedItem?.invoice.id]);

  async function handleSaveFollowUp() {
    if (!selectedItem) return;

    const note = form.note.trim();
    if (!note) {
      setErrorMessage("Follow-up note is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setMessage(null);

    const payload: InvoiceFollowUpPayload = {
      status: form.status,
      note,
      nextFollowUpAt: form.nextFollowUpAt || null,
    };

    try {
      const result = selectedItem.latestFollowUp
        ? await invoiceApi.updateInvoiceFollowUpWithResult(selectedItem.latestFollowUp.id, payload)
        : await invoiceApi.createInvoiceFollowUpWithResult(selectedItem.invoice.id, payload);

      if (!result.ok || !result.body.success) {
        setErrorMessage(result.body.message ?? "Failed to save follow-up.");
        return;
      }

      setMessage("Follow-up saved.");
      await loadFollowUps(selectedItem.invoice.id);
      setHistoryReloadKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save follow-up.");
    } finally {
      setIsSaving(false);
    }
  }

  const summary = dashboard?.summary;

  return (
    <div id="invoice-follow-up-tracker">
      <DashboardPanel
        title="Invoice Follow-Up Tracker"
        description="Track contacted customers, promised payment, escalation, and next action for overdue invoices. Because overdue money does not collect itself, tragically."
        actions={
          <DashboardActions>
            <DashboardActionButton icon={RefreshCw} onClick={() => void loadFollowUps()} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </DashboardActionButton>
          </DashboardActions>
        }
      >
        <div className="space-y-4 p-4">
          {errorMessage && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">{errorMessage}</p>}
          {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{message}</p>}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="Overdue Invoices"
              value={String(summary?.overdueCount ?? 0)}
              description="Open invoices past due date"
              tone="rose"
            />
            <StatCard
              icon={CheckCircle2}
              label="With Follow-Up"
              value={String(summary?.withFollowUpCount ?? 0)}
              description={`${summary?.withoutFollowUpCount ?? 0} still need a note`}
              tone="blue"
            />
            <StatCard
              icon={CalendarClock}
              label="Unresolved"
              value={String(summary?.unresolvedCount ?? 0)}
              description="Latest note is not resolved"
              tone="amber"
            />
            <StatCard
              icon={CheckCircle2}
              label="Resolved"
              value={String(summary?.statusCounts.RESOLVED ?? 0)}
              description="Follow-up marked resolved"
              tone="green"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <table className="min-w-full divide-y divide-neutral-100 text-sm">
                <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-3 py-2">Invoice</th>
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Due</th>
                    <th className="px-3 py-2">Latest Follow-Up</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items.map((item) => {
                    const isSelected = selectedItem?.invoice.id === item.invoice.id;
                    return (
                      <tr
                        key={item.invoice.id}
                        className={isSelected ? "bg-blue-50/70" : "hover:bg-neutral-50"}
                      >
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoiceId(item.invoice.id)}
                            className="text-left font-semibold text-blue-700 hover:text-blue-900"
                          >
                            {item.invoice.invoiceNumber}
                          </button>
                          <p className="text-xs text-rose-600">{item.invoice.daysOverdue} day(s) overdue</p>
                        </td>
                        <td className="px-3 py-2 text-neutral-700">{item.invoice.customerName}</td>
                        <td className="px-3 py-2 text-neutral-600">{formatDate(item.invoice.dueDate)}</td>
                        <td className="px-3 py-2">
                          {item.latestFollowUp ? (
                            <div>
                              <p className="font-semibold text-neutral-800">{STATUS_LABELS[item.latestFollowUp.status]}</p>
                              <p className="line-clamp-1 text-xs text-neutral-500">{item.latestFollowUp.note}</p>
                            </div>
                          ) : (
                            <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">No follow-up</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-neutral-900">{formatCurrency(item.invoice.grandTotal)}</td>
                      </tr>
                    );
                  })}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-sm text-neutral-500">
                        No overdue invoices require follow-up right now.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                {selectedItem ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Selected invoice</p>
                      <p className="text-lg font-bold text-neutral-950">{selectedItem.invoice.invoiceNumber}</p>
                      <p className="text-sm text-neutral-600">
                        {selectedItem.invoice.customerName} · {formatCurrency(selectedItem.invoice.grandTotal)} · {selectedItem.invoice.daysOverdue} day(s) overdue
                      </p>
                    </div>

                    <label className="block text-sm font-semibold text-neutral-700">
                      Status
                      <select
                        value={form.status}
                        onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as InvoiceFollowUpStatus }))}
                        disabled={!canManage || isSaving}
                        className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                      >
                        {FOLLOW_UP_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm font-semibold text-neutral-700">
                      Next follow-up
                      <input
                        type="datetime-local"
                        value={form.nextFollowUpAt ?? ""}
                        onChange={(event) => setForm((current) => ({ ...current, nextFollowUpAt: event.target.value }))}
                        disabled={!canManage || isSaving}
                        className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="block text-sm font-semibold text-neutral-700">
                      Note
                      <textarea
                        value={form.note}
                        onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                        disabled={!canManage || isSaving}
                        rows={5}
                        placeholder="Example: contacted customer by WhatsApp, payment promised Friday."
                        className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"
                      />
                    </label>

                    <div className="flex flex-wrap justify-end gap-2">
                      <DashboardActionButton icon={FileInput} onClick={() => loadInvoiceToEditor(selectedItem.invoice)}>
                        Load Invoice
                      </DashboardActionButton>
                      <DashboardActionButton
                        icon={CheckCircle2}
                        onClick={() => void handleSaveFollowUp()}
                        disabled={!canManage || isSaving}
                      >
                        {isSaving ? "Saving..." : selectedItem.latestFollowUp ? "Update Follow-Up" : "Save Follow-Up"}
                      </DashboardActionButton>
                    </div>

                    {!canManage && (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                        You can view follow-ups, but creating or updating notes requires a management role.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">Select an overdue invoice to manage its follow-up.</p>
                )}
              </div>

              <InvoiceFollowUpHistoryTimeline
                invoiceId={selectedItem?.invoice.id ?? null}
                invoiceNumber={selectedItem?.invoice.invoiceNumber ?? null}
                reloadSignal={historyReloadKey}
              />
            </div>
          </div>
        </div>
      </DashboardPanel>
    </div>
  );
}
