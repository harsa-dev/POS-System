"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, CalendarClock, ClipboardList, FileInput, RefreshCw } from "lucide-react";

import {
  invoiceApi,
  type InvoiceFollowUpReminderDashboardDto,
  type InvoiceFollowUpReminderDto,
  type InvoiceFollowUpReminderScope,
} from "@/lib/api/invoice-api";
import { formatCurrency } from "@/features/shared/format";
import { DashboardActionButton, DashboardActions, DashboardPanel, StatCard } from "@/features/shared/dashboard";
import {
  INVOICE_GENERATOR_LOAD_INVOICE_EVENT,
  INVOICE_GENERATOR_OPEN_FOLLOW_UP_EVENT,
  INVOICE_GENERATOR_REFRESH_SUMMARY_EVENT,
  type InvoiceGeneratorLoadInvoiceEventDetail,
  type InvoiceGeneratorOpenFollowUpEventDetail,
} from "./invoice-generator-events";

type ScopeOption = {
  value: InvoiceFollowUpReminderScope;
  label: string;
};

const SCOPE_OPTIONS: ScopeOption[] = [
  { value: "due", label: "Due now" },
  { value: "upcoming", label: "Upcoming" },
  { value: "all", label: "All reminders" },
];

const FOLLOW_UP_STATUS_LABELS: Record<string, string> = {
  CONTACTED: "Contacted",
  WAITING_RESPONSE: "Waiting response",
  PROMISED_PAYMENT: "Promised payment",
  RESOLVED: "Resolved",
  ESCALATED: "Escalated",
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

function getReminderLabel(item: InvoiceFollowUpReminderDto) {
  if (item.reminder.isDue) {
    return item.reminder.daysLate === 0
      ? "Due now"
      : `${item.reminder.daysLate} day(s) late`;
  }
  return `${item.reminder.daysUntil} day(s) left`;
}

function loadInvoiceToEditor(item: InvoiceFollowUpReminderDto) {
  const detail: InvoiceGeneratorLoadInvoiceEventDetail = {
    invoiceId: item.invoice.id,
    invoiceNumber: item.invoice.invoiceNumber,
  };
  window.dispatchEvent(new CustomEvent(INVOICE_GENERATOR_LOAD_INVOICE_EVENT, { detail }));
  document.getElementById("invoice-generator-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openFollowUp(item: InvoiceFollowUpReminderDto) {
  const detail: InvoiceGeneratorOpenFollowUpEventDetail = {
    invoiceId: item.invoice.id,
    invoiceNumber: item.invoice.invoiceNumber,
  };
  window.dispatchEvent(new CustomEvent(INVOICE_GENERATOR_OPEN_FOLLOW_UP_EVENT, { detail }));
  document.getElementById("invoice-follow-up-tracker")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function InvoiceFollowUpRemindersPanel() {
  const [dashboard, setDashboard] = useState<InvoiceFollowUpReminderDashboardDto | null>(null);
  const [scope, setScope] = useState<InvoiceFollowUpReminderScope>("due");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadReminders = useCallback(async (nextScope: InvoiceFollowUpReminderScope = scope) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await invoiceApi.getFollowUpReminders({ scope: nextScope, limit: 50 });
      if (!response.success || !response.data) {
        setErrorMessage(response.message ?? "Failed to load follow-up reminders.");
        return;
      }
      setDashboard(response.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load follow-up reminders.");
    } finally {
      setIsLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void loadReminders(scope);
  }, [loadReminders, scope]);

  useEffect(() => {
    function handleRefresh() {
      void loadReminders(scope);
    }

    window.addEventListener(INVOICE_GENERATOR_REFRESH_SUMMARY_EVENT, handleRefresh);
    return () => window.removeEventListener(INVOICE_GENERATOR_REFRESH_SUMMARY_EVENT, handleRefresh);
  }, [loadReminders, scope]);

  const summary = dashboard?.summary;
  const items = dashboard?.items ?? [];

  return (
    <div id="invoice-follow-up-reminders">
      <DashboardPanel
        title="Follow-Up Due Reminders"
        description="Prioritize follow-up notes whose next action date is due or coming up. Because a reminder nobody sees is just a timestamp with delusions."
        actions={
          <DashboardActions>
            <DashboardActionButton icon={RefreshCw} onClick={() => void loadReminders()} disabled={isLoading}>
              {isLoading ? "Refreshing..." : "Refresh"}
            </DashboardActionButton>
          </DashboardActions>
        }
      >
        <div className="space-y-4 p-4">
          {errorMessage && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={BellRing}
              label="Due Reminders"
              value={String(summary?.dueCount ?? 0)}
              description={`${summary?.oldestDueDays ?? 0} oldest due day(s)`}
              tone="rose"
            />
            <StatCard
              icon={CalendarClock}
              label="Upcoming"
              value={String(summary?.upcomingCount ?? 0)}
              description={summary?.nextUpcomingAt ? `Next: ${formatDateTime(summary.nextUpcomingAt)}` : "No upcoming reminders"}
              tone="amber"
            />
            <StatCard
              icon={ClipboardList}
              label="Total Active"
              value={String(summary?.totalReminderCount ?? 0)}
              description="Latest unresolved follow-ups"
              tone="blue"
            />
            <StatCard
              icon={RefreshCw}
              label="Scope"
              value={SCOPE_OPTIONS.find((option) => option.value === scope)?.label ?? "Due now"}
              description="Current reminder filter"
              tone="slate"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {SCOPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setScope(option.value)}
                className={
                  scope === option.value
                    ? "rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white"
                    : "rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                }
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="min-w-full divide-y divide-neutral-100 text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Reminder</th>
                  <th className="px-3 py-2">Latest Status</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {items.map((item) => (
                  <tr key={item.followUp.id} className={item.reminder.isDue ? "bg-rose-50/40" : "hover:bg-neutral-50"}>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-neutral-950">{item.invoice.invoiceNumber}</p>
                      <p className="text-xs text-neutral-500">
                        {item.invoice.customerName} · {item.invoice.daysOverdue} invoice overdue day(s)
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <p className={item.reminder.isDue ? "font-semibold text-rose-700" : "font-semibold text-amber-700"}>
                        {getReminderLabel(item)}
                      </p>
                      <p className="text-xs text-neutral-500">{formatDateTime(item.reminder.nextFollowUpAt)}</p>
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-semibold text-neutral-800">
                        {FOLLOW_UP_STATUS_LABELS[item.followUp.status] ?? item.followUp.status}
                      </p>
                      <p className="line-clamp-1 text-xs text-neutral-500">{item.followUp.note}</p>
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-neutral-900">
                      {formatCurrency(item.invoice.grandTotal)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <DashboardActionButton icon={ClipboardList} onClick={() => openFollowUp(item)}>
                          Follow Up
                        </DashboardActionButton>
                        <DashboardActionButton icon={FileInput} onClick={() => loadInvoiceToEditor(item)}>
                          Load
                        </DashboardActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-neutral-500">
                      No follow-up reminders match this scope.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardPanel>
    </div>
  );
}
