"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, History, RefreshCw, Save } from "lucide-react";

import { invoiceApi, type InvoiceRecord } from "@/lib/api/invoice-api";
import { formatCurrency } from "@/features/shared/format";
import {
  DashboardActionButton,
  DashboardActions,
  DashboardPanel,
  DashboardShell,
} from "@/features/shared/dashboard";
import { InvoiceForm } from "../components/invoice-form";
import { InvoicePreview } from "../components/invoice-preview";
import { InvoiceStatus } from "../components/invoice-status";
import { createInitialInvoice } from "../data/invoice-mock";
import {
  clearInvoiceDraft,
  loadInvoiceDraft,
  saveInvoiceDraft,
} from "../services/invoice-draft-storage";
import {
  mapInvoiceDraftToPayload,
  mapInvoiceRecordToDraft,
} from "../services/invoice-api-mapper";
import { calculateInvoiceTotals } from "../services/invoice-calculations";
import { downloadInvoicePdf } from "../services/invoice-pdf";
import { validateInvoiceDraft } from "../services/invoice-validation";
import type { InvoiceDraft } from "@/features/shared/types";
import {
  INVOICE_GENERATOR_LOAD_INVOICE_EVENT,
  type InvoiceGeneratorLoadInvoiceEventDetail,
} from "./invoice-generator-events";

type SaveSource = "local" | "backend";

export function InvoiceGeneratorDashboard() {
  const [storedInvoice] = useState(() => loadInvoiceDraft());
  const [invoice, setInvoice] = useState<InvoiceDraft>(
    () => storedInvoice?.draft ?? createInitialInvoice(),
  );
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceRecord[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    () => storedInvoice?.savedAt ?? null,
  );
  const [saveSource, setSaveSource] = useState<SaveSource | null>(
    () => (storedInvoice ? "local" : null),
  );

  const totals = useMemo(() => calculateInvoiceTotals(invoice), [invoice]);
  const validationIssues = useMemo(() => validateInvoiceDraft(invoice), [invoice]);

  async function loadInvoiceHistory() {
    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const response = await invoiceApi.listInvoices();
      if (!response.success || !response.data) {
        setHistoryError(response.message ?? "Failed to load invoice history");
        return;
      }

      setInvoiceHistory(response.data);
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Failed to load invoice history",
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }

  useEffect(() => {
    void loadInvoiceHistory();
  }, []);

  function handleReset() {
    clearInvoiceDraft();
    setInvoice(createInitialInvoice());
    setCurrentInvoiceId(null);
    setLastSavedAt(null);
    setSaveSource(null);
    setSaveMessage(null);
    setSaveError(null);
  }

  async function handleSave() {
    if (isSaving) return;

    const browserDraft = saveInvoiceDraft(invoice);
    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const payload = mapInvoiceDraftToPayload(invoice);
      const result = currentInvoiceId
        ? await invoiceApi.updateInvoiceWithResult(currentInvoiceId, payload)
        : await invoiceApi.createInvoiceWithResult(payload);

      if (!result.ok || !result.body.success || !result.body.data) {
        setLastSavedAt(browserDraft?.savedAt ?? null);
        setSaveSource(browserDraft ? "local" : null);
        setSaveError(result.body.message ?? "Failed to save invoice");
        return;
      }

      clearInvoiceDraft();
      setCurrentInvoiceId(result.body.data.id);
      setInvoice(mapInvoiceRecordToDraft(result.body.data));
      setLastSavedAt(result.body.data.updatedAt);
      setSaveSource("backend");
      setSaveMessage("Invoice saved to backend.");
      await loadInvoiceHistory();
    } catch (error) {
      setLastSavedAt(browserDraft?.savedAt ?? null);
      setSaveSource(browserDraft ? "local" : null);
      setSaveError(error instanceof Error ? error.message : "Failed to save invoice");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLoadInvoice(invoiceId: string) {
    setLoadingInvoiceId(invoiceId);
    setHistoryError(null);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const response = await invoiceApi.getInvoice(invoiceId);
      if (!response.success || !response.data) {
        setHistoryError(response.message ?? "Failed to load invoice");
        return;
      }

      clearInvoiceDraft();
      setCurrentInvoiceId(response.data.id);
      setInvoice(mapInvoiceRecordToDraft(response.data));
      setLastSavedAt(response.data.updatedAt);
      setSaveSource("backend");
      setSaveMessage(`Loaded invoice ${response.data.invoiceNumber} from backend history.`);
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Failed to load invoice",
      );
    } finally {
      setLoadingInvoiceId(null);
    }
  }

  useEffect(() => {
    function handleHistoryLoad(event: Event) {
      const customEvent = event as CustomEvent<InvoiceGeneratorLoadInvoiceEventDetail>;
      const invoiceId = customEvent.detail?.invoiceId;
      if (!invoiceId) return;
      void handleLoadInvoice(invoiceId);
    }

    window.addEventListener(INVOICE_GENERATOR_LOAD_INVOICE_EVENT, handleHistoryLoad);
    return () => {
      window.removeEventListener(INVOICE_GENERATOR_LOAD_INVOICE_EVENT, handleHistoryLoad);
    };
  }, []);

  return (
    <DashboardShell
      title="Invoice Generator"
      description="Create, save, and print standalone invoices for this business."
    >
      <DashboardPanel>
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <InvoiceStatus status={invoice.paymentStatus} />
              {lastSavedAt && (
                <span className="text-sm text-neutral-500">
                  Last saved {saveSource === "backend" ? "to backend" : "locally"} at: {new Date(lastSavedAt).toLocaleString("id-ID")}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              Totals are recalculated by the backend when saved. Browser draft storage remains as a fallback until a backend save succeeds.
            </p>
            {saveMessage && (
              <p className="mt-2 text-sm font-medium text-emerald-700">{saveMessage}</p>
            )}
            {saveError && (
              <p className="mt-2 text-sm font-medium text-rose-700">{saveError}</p>
            )}
          </div>
          <DashboardActions>
            <DashboardActionButton
              icon={History}
              onClick={() => setIsHistoryOpen((isOpen) => !isOpen)}
              title="Show saved backend invoices."
            >
              History
            </DashboardActionButton>
            <DashboardActionButton icon={RefreshCw} onClick={handleReset}>
              Reset
            </DashboardActionButton>
            <DashboardActionButton
              icon={Save}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : currentInvoiceId ? "Update Invoice" : "Save Invoice"}
            </DashboardActionButton>
            <DashboardActionButton icon={Download} variant="primary" onClick={downloadInvoicePdf}>
              Print / Save PDF
            </DashboardActionButton>
          </DashboardActions>
        </div>
      </DashboardPanel>

      {isHistoryOpen && (
        <DashboardPanel title="Saved Invoice History">
          <div className="space-y-3 p-4">
            {isLoadingHistory && (
              <p className="text-sm text-neutral-500">Loading saved invoices...</p>
            )}
            {historyError && (
              <p className="text-sm font-medium text-rose-700">{historyError}</p>
            )}
            {!isLoadingHistory && !historyError && invoiceHistory.length === 0 && (
              <p className="text-sm text-neutral-500">No saved invoices yet.</p>
            )}
            {invoiceHistory.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-500">
                    <tr>
                      <th className="px-3 py-3 font-semibold">Invoice</th>
                      <th className="px-3 py-3 font-semibold">Customer</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-3 py-3 text-right font-semibold">Total</th>
                      <th className="px-3 py-3 font-semibold">Updated</th>
                      <th className="px-3 py-3 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceHistory.map((savedInvoice) => (
                      <tr key={savedInvoice.id} className="border-t border-neutral-100">
                        <td className="px-3 py-3 font-semibold text-neutral-950">
                          {savedInvoice.invoiceNumber}
                        </td>
                        <td className="px-3 py-3 text-neutral-600">
                          {savedInvoice.customerName}
                        </td>
                        <td className="px-3 py-3 text-neutral-600">
                          {savedInvoice.status}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-neutral-950">
                          {formatCurrency(savedInvoice.grandTotal)}
                        </td>
                        <td className="px-3 py-3 text-neutral-500">
                          {new Date(savedInvoice.updatedAt).toLocaleString("id-ID")}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => void handleLoadInvoice(savedInvoice.id)}
                            disabled={loadingInvoiceId === savedInvoice.id}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {loadingInvoiceId === savedInvoice.id ? "Loading..." : "Load"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DashboardPanel>
      )}

      <div id="invoice-generator-editor" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
        <DashboardPanel title="Invoice Editor">
          <div className="p-4">
            {validationIssues.length > 0 && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-semibold">Draft values adjusted for safe totals</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {validationIssues.map((issue) => (
                    <li key={`${issue.field}-${issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              </div>
            )}
            <InvoiceForm invoice={invoice} onChange={setInvoice} />
          </div>
        </DashboardPanel>

        <div className="space-y-4">
          <DashboardPanel title="Live Invoice Preview">
            <div className="bg-neutral-50 p-4">
              <InvoicePreview invoice={invoice} totals={totals} />
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <InvoiceStatus status={invoice.paymentStatus} />
              <DashboardActions>
                <DashboardActionButton
                  icon={Download}
                  variant="primary"
                  onClick={downloadInvoicePdf}
                >
                  Print / Save PDF
                </DashboardActionButton>
                <DashboardActionButton
                  icon={Save}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : currentInvoiceId ? "Update Invoice" : "Save Invoice"}
                </DashboardActionButton>
                <DashboardActionButton icon={RefreshCw} onClick={handleReset}>
                  Reset
                </DashboardActionButton>
              </DashboardActions>
            </div>
          </DashboardPanel>
        </div>
      </div>
    </DashboardShell>
  );
}
