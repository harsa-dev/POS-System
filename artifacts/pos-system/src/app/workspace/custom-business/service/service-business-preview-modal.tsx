import { useState } from "react";
import { FilePlus2, X } from "lucide-react";
import { toast } from "sonner";

import { serviceBusinessApi } from "./service-business-api";
import { getApiErrorMessage } from "@/lib/api";
import type { ServiceBusinessPriority } from "./service-business-workspace-types";

export function ServiceBusinessNewRequestModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerSegment, setCustomerSegment] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<ServiceBusinessPriority>("NORMAL");
  const [summary, setSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!customerName.trim() || !serviceCategory.trim() || !title.trim()) {
      toast.error("Customer, service category, and title are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await serviceBusinessApi.createRequest({
        customerName: customerName.trim(),
        customerSegment: customerSegment.trim() || undefined,
        serviceCategory: serviceCategory.trim(),
        title: title.trim(),
        summary: summary.trim() || undefined,
        priority,
      });

      if (!result.success) {
        toast.error(result.message || "Failed to create service request.");
        return;
      }

      toast.success("Service request created.");
      onSuccess();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create service request."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-neutral-950/40 px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 pb-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="mt-1 text-lg font-bold text-neutral-950">New service request</h3>
              <p className="mt-1 text-sm leading-6 text-neutral-600">
                Creates a new service request in the{" "}
                <span className="font-semibold">Request intake</span> stage.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Customer name *" required>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. PT Sinar Utama"
                className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none focus:border-neutral-400"
                required
              />
            </FormField>

            <FormField label="Customer segment">
              <input
                value={customerSegment}
                onChange={(e) => setCustomerSegment(e.target.value)}
                placeholder="e.g. B2B Retainer, SMB Project"
                className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none focus:border-neutral-400"
              />
            </FormField>

            <FormField label="Service category *" required>
              <input
                value={serviceCategory}
                onChange={(e) => setServiceCategory(e.target.value)}
                placeholder="e.g. HVAC Maintenance, Consulting"
                className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none focus:border-neutral-400"
                required
              />
            </FormField>

            <FormField label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ServiceBusinessPriority)}
                className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 outline-none focus:border-neutral-400"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Request title *" required>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the service request"
                  className="mt-1 h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-700 outline-none focus:border-neutral-400"
                  required
                />
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField label="Summary">
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe the customer problem, expected output, and handoff scope."
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-700 outline-none focus:border-neutral-400"
                />
              </FormField>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-neutral-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isSubmitting ? "Creating…" : "Create request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  children,
  label,
  required,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-neutral-500">
        {label}
        {required ? null : <span className="ml-1 font-normal text-neutral-400">(optional)</span>}
      </span>
      {children}
    </label>
  );
}
