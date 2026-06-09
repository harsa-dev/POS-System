"use client";

import { useMemo, useState } from "react";
import { Download, History, RefreshCw, Save } from "lucide-react";

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
import { calculateInvoiceTotals } from "../services/invoice-calculations";
import { downloadInvoicePdf } from "../services/invoice-pdf";
import { validateInvoiceDraft } from "../services/invoice-validation";
import type { InvoiceDraft } from "@/features/shared/types";

export function InvoiceGeneratorDashboard() {
  const [storedInvoice] = useState(() => loadInvoiceDraft());
  const [invoice, setInvoice] = useState<InvoiceDraft>(
    () => storedInvoice?.draft ?? createInitialInvoice(),
  );
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(
    () => storedInvoice?.savedAt ?? null,
  );

  const totals = useMemo(() => calculateInvoiceTotals(invoice), [invoice]);
  const validationIssues = useMemo(() => validateInvoiceDraft(invoice), [invoice]);

  function handleReset() {
    clearInvoiceDraft();
    setInvoice(createInitialInvoice());
    setLastSavedAt(null);
  }

  function handleSave() {
    const savedDraft = saveInvoiceDraft(invoice);
    setLastSavedAt(savedDraft?.savedAt ?? null);
  }

  return (
    <DashboardShell
      title="Invoice Generator"
      description="Create and print local invoice drafts without backend persistence."
    >
      <DashboardPanel>
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <InvoiceStatus status={invoice.paymentStatus} />
              {lastSavedAt && (
                <span className="text-sm text-neutral-500">
                  Last saved locally at: {new Date(lastSavedAt).toLocaleString("id-ID")}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              This module is local-only for now. Save records a timestamp in this screen, and Print / Save PDF uses the browser print dialog.
            </p>
          </div>
          <DashboardActions>
            <DashboardActionButton
              icon={History}
              disabled
              title="Invoice history is coming soon."
            >
              History (Soon)
            </DashboardActionButton>
            <DashboardActionButton icon={RefreshCw} onClick={handleReset}>
              Reset
            </DashboardActionButton>
            <DashboardActionButton icon={Save} onClick={handleSave}>
              Save Local Draft
            </DashboardActionButton>
            <DashboardActionButton icon={Download} variant="primary" onClick={downloadInvoicePdf}>
              Print / Save PDF
            </DashboardActionButton>
          </DashboardActions>
        </div>
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
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
                <DashboardActionButton icon={Save} onClick={handleSave}>
                  Save Local Draft
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
