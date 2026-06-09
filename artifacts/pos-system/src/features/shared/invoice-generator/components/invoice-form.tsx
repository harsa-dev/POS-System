import type { ReactNode } from "react";
import { Upload } from "lucide-react";
import { InvoiceItems } from "./invoice-items";
import { InvoiceStatus } from "./invoice-status";
import {
  getInvoiceStatusMetadata,
  invoicePaymentStatuses,
} from "../data/invoice-status";
import { clampInvoiceNumber } from "../services/invoice-calculations";
import type {
  InvoiceBillingInfo,
  InvoiceBusinessInfo,
  InvoiceCustomerInfo,
  InvoiceDiscount,
  InvoiceDraft,
} from "@/features/shared/types";

type InvoiceFormProps = {
  invoice: InvoiceDraft;
  onChange: (invoice: InvoiceDraft) => void;
};

function TextField({
  label,
  value,
  type = "text",
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-neutral-700">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-neutral-200 px-3 outline-none focus:border-neutral-400"
      />
    </label>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
      <h3 className="font-semibold text-neutral-950">{title}</h3>
      {children}
    </section>
  );
}

export function InvoiceForm({ invoice, onChange }: InvoiceFormProps) {
  const selectedStatus = getInvoiceStatusMetadata(invoice.paymentStatus);

  function updateBusiness(updates: Partial<InvoiceBusinessInfo>) {
    onChange({ ...invoice, business: { ...invoice.business, ...updates } });
  }

  function updateCustomer(updates: Partial<InvoiceCustomerInfo>) {
    onChange({ ...invoice, customer: { ...invoice.customer, ...updates } });
  }

  function updateBilling(updates: Partial<InvoiceBillingInfo>) {
    onChange({ ...invoice, billing: { ...invoice.billing, ...updates } });
  }

  function updateDiscount(updates: Partial<InvoiceDiscount>) {
    onChange({ ...invoice, discount: { ...invoice.discount, ...updates } });
  }

  function handleLogoUpload(file?: File) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => updateBusiness({ logoUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-4">
      <Section title="Business Information">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400">
            {invoice.business.logoUrl ? (
              <img
                src={invoice.business.logoUrl}
                alt="Business logo"
                className="h-full w-full object-cover"
              />
            ) : (
              "Logo"
            )}
          </div>
          <label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => handleLogoUpload(event.target.files?.[0])}
              className="sr-only"
            />
            <span className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload Logo
            </span>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <TextField
            label="Business Name"
            value={invoice.business.name}
            onChange={(value) => updateBusiness({ name: value })}
          />
          <TextField
            label="Business Email"
            value={invoice.business.email}
            onChange={(value) => updateBusiness({ email: value })}
          />
          <TextField
            label="Business Address"
            value={invoice.business.address}
            onChange={(value) => updateBusiness({ address: value })}
          />
          <TextField
            label="Business Phone / WhatsApp"
            value={invoice.business.phone}
            onChange={(value) => updateBusiness({ phone: value })}
          />
        </div>
      </Section>

      <Section title="Customer & Billing Information">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <TextField
              label="Customer Name"
              value={invoice.customer.name}
              onChange={(value) => updateCustomer({ name: value })}
            />
            <TextField
              label="Customer Address"
              value={invoice.customer.address}
              onChange={(value) => updateCustomer({ address: value })}
            />
            <TextField
              label="Customer Phone / WhatsApp"
              value={invoice.customer.phone}
              onChange={(value) => updateCustomer({ phone: value })}
            />
          </div>
          <div className="grid gap-3">
            <TextField
              label="Invoice Number"
              value={invoice.billing.invoiceNumber}
              onChange={(value) => updateBilling({ invoiceNumber: value })}
            />
            <TextField
              label="Invoice Date"
              type="date"
              value={invoice.billing.invoiceDate}
              onChange={(value) => updateBilling({ invoiceDate: value })}
            />
            <TextField
              label="Due Date (optional)"
              type="date"
              value={invoice.billing.dueDate ?? ""}
              onChange={(value) => updateBilling({ dueDate: value })}
            />
          </div>
        </div>
      </Section>

      <Section title="Invoice Items">
        <InvoiceItems
          items={invoice.items}
          onChange={(items) => onChange({ ...invoice, items })}
        />
      </Section>

      <Section title="Payment Status">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {invoicePaymentStatuses.map((status) => {
              const metadata = getInvoiceStatusMetadata(status);

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => onChange({ ...invoice, paymentStatus: status })}
                  title={metadata.description}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    invoice.paymentStatus === status
                      ? "border-neutral-950 bg-neutral-950 text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {metadata.label}
                </button>
              );
            })}
          </div>
          <div className="grid gap-1 text-sm sm:justify-items-end">
            <InvoiceStatus status={invoice.paymentStatus} />
            <p className="max-w-sm text-neutral-500">{selectedStatus.description}</p>
          </div>
        </div>
      </Section>

      <Section title="Discount Section">
        <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium text-neutral-700">Discount Mode</span>
            <select
              value={invoice.discount.mode}
              onChange={(event) => {
                const mode = event.target.value as InvoiceDiscount["mode"];

                updateDiscount({
                  mode,
                  value:
                    mode === "percentage"
                      ? clampInvoiceNumber(invoice.discount.value, 100)
                      : clampInvoiceNumber(invoice.discount.value),
                });
              }}
              className="h-10 rounded-lg border border-neutral-200 px-3 outline-none focus:border-neutral-400"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (Rp)</option>
            </select>
          </label>
          <TextField
            label={
              invoice.discount.mode === "percentage"
                ? "Discount Percentage"
                : "Discount Amount"
            }
            type="number"
            value={String(invoice.discount.value)}
            onChange={(value) =>
              updateDiscount({
                value:
                  invoice.discount.mode === "percentage"
                    ? clampInvoiceNumber(Number(value), 100)
                    : clampInvoiceNumber(Number(value)),
              })
            }
          />
        </div>
        <p className="text-xs text-neutral-500">
          Percentage discounts are limited to 0-100%. Fixed discounts are capped to the subtotal in the preview.
        </p>
      </Section>

      <Section title="Notes Section">
        <textarea
          value={invoice.notes}
          onChange={(event) => onChange({ ...invoice, notes: event.target.value })}
          placeholder="Add invoice notes..."
          className="min-h-28 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
        />
      </Section>
    </div>
  );
}
