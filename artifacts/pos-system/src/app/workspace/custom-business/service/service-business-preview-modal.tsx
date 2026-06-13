import { useState } from "react";
import { FilePlus2, ReceiptText, X } from "lucide-react";

import {
  calculateQuoteSubtotal,
  calculateQuoteTax,
  calculateQuoteTotal,
  formatServiceMoney,
} from "./service-business-workspace-domain";
import type {
  ServiceBusinessJob,
  ServiceBusinessPriority,
} from "./service-business-workspace-types";

export type ServiceBusinessPreviewModalType = "request" | "quotation";

export function ServiceBusinessPreviewModal({
  selectedJob,
  type,
  onClose,
}: {
  selectedJob: ServiceBusinessJob | null;
  type: ServiceBusinessPreviewModalType;
  onClose: () => void;
}) {
  const [customerName, setCustomerName] = useState(
    selectedJob?.customerName ?? "Preview Customer",
  );
  const [customerSegment, setCustomerSegment] = useState(
    selectedJob?.customerSegment ?? "B2B",
  );
  const [serviceCategory, setServiceCategory] = useState(
    selectedJob?.serviceCategory ?? "General Service",
  );
  const [title, setTitle] = useState(
    selectedJob?.title ?? "New service request preview",
  );
  const [priority, setPriority] = useState<ServiceBusinessPriority>(
    selectedJob?.priority ?? "NORMAL",
  );
  const [summary, setSummary] = useState(
    selectedJob?.summary ?? "Describe the customer problem, expected output, and handoff scope.",
  );
  const [discountAmount, setDiscountAmount] = useState(
    String(selectedJob?.quote.discountAmount ?? 0),
  );
  const [targetMarginRate, setTargetMarginRate] = useState(
    String(selectedJob?.quote.targetMarginRate ?? 35),
  );
  const [taxRate, setTaxRate] = useState(String(selectedJob?.quote.taxRate ?? 11));

  const isRequestPreview = type === "request";
  const numericDiscount = Number(discountAmount) || 0;
  const numericTaxRate = Number(taxRate) || 0;
  const numericMarginRate = Number(targetMarginRate) || 0;
  const baseSubtotal = selectedJob ? calculateQuoteSubtotal(selectedJob) : 0;
  const previewTax = selectedJob ? calculateQuoteTax(selectedJob) : 0;
  const previewTotal = selectedJob ? calculateQuoteTotal(selectedJob) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-950/40 px-4 py-8">
      <div className="w-full max-w-4xl rounded-3xl border border-neutral-200 bg-white p-5 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
              {isRequestPreview ? (
                <FilePlus2 className="h-5 w-5" />
              ) : (
                <ReceiptText className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">
                Local-only preview
              </p>
              <h3 className="mt-1 text-lg font-bold text-neutral-950">
                {isRequestPreview ? "New request preview" : "Draft quotation preview"}
              </h3>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                This modal stores nothing, calls no API, and only previews the future form shape.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500"
            aria-label="Close preview modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isRequestPreview ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Customer" value={customerName} onChange={setCustomerName} />
              <TextField label="Segment" value={customerSegment} onChange={setCustomerSegment} />
              <TextField label="Service category" value={serviceCategory} onChange={setServiceCategory} />
              <label className="block">
                <span className="text-xs font-bold text-neutral-500">Priority</span>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as ServiceBusinessPriority)}
                  className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 outline-none focus:border-neutral-400"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </label>
              <div className="md:col-span-2">
                <TextField label="Title" value={title} onChange={setTitle} />
              </div>
              <label className="block md:col-span-2">
                <span className="text-xs font-bold text-neutral-500">Summary</span>
                <textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className="mt-1 min-h-28 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-700 outline-none focus:border-neutral-400"
                />
              </label>
            </div>

            <PreviewPayload
              title="Request payload preview"
              rows={[
                ["customerName", customerName],
                ["customerSegment", customerSegment],
                ["serviceCategory", serviceCategory],
                ["title", title],
                ["priority", priority],
              ]}
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4 md:grid-cols-3">
              <TextField label="Selected job" value={selectedJob?.requestCode ?? "No selected job"} readOnly />
              <TextField label="Discount amount" value={discountAmount} onChange={setDiscountAmount} />
              <TextField label="Tax rate" value={taxRate} onChange={setTaxRate} />
              <TextField label="Target margin rate" value={targetMarginRate} onChange={setTargetMarginRate} />
              <TextField label="Subtotal reference" value={formatServiceMoney(baseSubtotal)} readOnly />
              <TextField label="Existing quote total" value={formatServiceMoney(previewTotal)} readOnly />
              <div className="md:col-span-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
                The editable fields preview quotation inputs only. They do not recalculate the selected job yet because the backend pricing rule is not final.
              </div>
            </div>

            <PreviewPayload
              title="Quotation payload preview"
              rows={[
                ["requestId", selectedJob?.id ?? "missing-selected-job"],
                ["discountAmount", String(numericDiscount)],
                ["taxRate", String(numericTaxRate)],
                ["targetMarginRate", String(numericMarginRate)],
                ["currentComputedTax", formatServiceMoney(previewTax)],
                ["currentComputedTotal", formatServiceMoney(previewTotal)],
              ]}
            />
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-neutral-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700"
          >
            Close preview
          </button>
          <button
            disabled
            type="button"
            className="cursor-not-allowed rounded-xl bg-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-500"
          >
            Submit disabled until backend exists
          </button>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  onChange,
  readOnly = false,
  value,
}: {
  label: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-neutral-500">{label}</span>
      <input
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none focus:border-neutral-400 read-only:bg-neutral-50"
      />
    </label>
  );
}

function PreviewPayload({
  rows,
  title,
}: {
  rows: readonly (readonly [string, string])[];
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
      <h4 className="text-sm font-bold text-neutral-950">{title}</h4>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.map(([key, value]) => (
          <div key={key} className="rounded-xl bg-white px-3 py-2">
            <dt className="text-xs font-semibold text-neutral-400">{key}</dt>
            <dd className="mt-1 break-words font-semibold text-neutral-800">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
