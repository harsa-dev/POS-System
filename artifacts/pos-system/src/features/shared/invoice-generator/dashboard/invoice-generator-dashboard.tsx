"use client";

import { useMemo, useState } from "react";
import { Download, History, RefreshCw, Save } from "lucide-react";

import { DashboardActionButton, DashboardActions, DashboardPanel, DashboardShell } from "@/features/shared/dashboard";
import { InvoiceForm } from "../components/invoice-form";
import { InvoicePreview } from "../components/invoice-preview";
import { InvoiceStatus } from "../components/invoice-status";
import { createInitialInvoice } from "../data/invoice-mock";
import { downloadInvoicePdf } from "../services/invoice-pdf";
import type { InvoiceDraft, InvoiceTotals } from "@/features/shared/types";

function calculateTotals(invoice: InvoiceDraft): InvoiceTotals {
  const subtotal = invoice.items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );
  const discountAmount =
    invoice.discount.mode === "percentage"
      ? subtotal * (invoice.discount.value / 100)
      : invoice.discount.value;
  const grandTotal = Math.max(subtotal - discountAmount, 0);

  return { subtotal, discountAmount, grandTotal };
}

export function InvoiceGeneratorDashboard() {
  const [invoice, setInvoice] = useState<InvoiceDraft>(() => createInitialInvoice());
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const totals = useMemo(() => calculateTotals(invoice), [invoice]);

  function handleReset() {
    setInvoice(createInitialInvoice());
    setLastSavedAt(null);
  }

  function handleSave() {
    setLastSavedAt(new Date().toLocaleString("id-ID"));
  }

  return (
    <DashboardShell
      title="Invoice Generator"
      description="Create, preview, save, and download reusable business invoices as PDF."
    >
      <DashboardPanel>
        <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <InvoiceStatus status={invoice.paymentStatus} />
              {lastSavedAt && (
                <span className="text-sm text-neutral-500">
                  Last saved: {lastSavedAt}
                </span>
              )}
            </div>
          </div>
          <DashboardActions>
            <DashboardActionButton icon={History}>History</DashboardActionButton>
            <DashboardActionButton icon={RefreshCw} onClick={handleReset}>Reset</DashboardActionButton>
            <DashboardActionButton icon={Save} onClick={handleSave}>Save</DashboardActionButton>
            <DashboardActionButton icon={Download} variant="primary" onClick={downloadInvoicePdf}>
              Download PDF
            </DashboardActionButton>
          </DashboardActions>
        </div>
      </DashboardPanel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
        <DashboardPanel title="Invoice Editor">
          <div className="p-4">
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
                <DashboardActionButton icon={Download} variant="primary" onClick={downloadInvoicePdf}>
                  Download PDF
                </DashboardActionButton>
                <DashboardActionButton icon={Save} onClick={handleSave}>Save</DashboardActionButton>
                <DashboardActionButton icon={RefreshCw} onClick={handleReset}>Reset</DashboardActionButton>
              </DashboardActions>
            </div>
          </DashboardPanel>
        </div>
      </div>
    </DashboardShell>
  );
}
