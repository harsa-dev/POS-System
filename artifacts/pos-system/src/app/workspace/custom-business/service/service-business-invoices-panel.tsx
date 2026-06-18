import {
  calculateQuoteTotal,
  formatServiceMoney,
  getInvoiceStatusLabel,
  getServiceStatusLabel,
} from "./service-business-workspace-domain";
import type { ServiceBusinessJob } from "./service-business-workspace-types";
import { ServicePill, ServiceSectionCard } from "./service-business-workspace-ui";

function getInvoiceStatusTone(status: string) {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "partial") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "issued") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "overdue") return "border-red-200 bg-red-50 text-red-700";
  return "border-neutral-200 bg-neutral-50 text-neutral-700";
}

export function ServiceBusinessInvoicesPanel({
  jobs,
}: {
  jobs: readonly ServiceBusinessJob[];
}) {
  const rows = jobs.map((job) => {
    const quoteTotal = calculateQuoteTotal(job);
    const remaining = Math.max(quoteTotal - job.invoice.paidAmount, 0);
    const collectionRate =
      quoteTotal > 0 ? Math.min(Math.round((job.invoice.paidAmount / quoteTotal) * 100), 100) : 0;

    return {
      jobId: job.id,
      requestCode: job.requestCode,
      title: job.title,
      customerName: job.customerName,
      invoiceCode: job.invoice.code,
      invoiceStatus: job.invoice.status,
      dueDate: job.invoice.dueDate,
      paidAmount: job.invoice.paidAmount,
      total: quoteTotal,
      remaining,
      collectionRate,
      jobStatus: job.status,
    };
  });

  if (rows.length === 0) {
    return (
      <ServiceSectionCard
        title="Invoices"
        description="Invoices linked to service jobs. Payment is recorded from the job action panel."
      >
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          No service jobs found. Create a request to get started.
        </div>
      </ServiceSectionCard>
    );
  }

  return (
    <ServiceSectionCard
      title="Invoices"
      description="Invoices linked to service jobs. Payment is recorded from the job action panel."
    >
      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-left">
              <Th>Invoice</Th>
              <Th>Job / Customer</Th>
              <Th>Status</Th>
              <Th>Paid</Th>
              <Th>Total</Th>
              <Th>Due date</Th>
              <Th>Collection</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.jobId} className="border-b border-neutral-100 last:border-0">
                <Td>
                  <span className="font-semibold text-neutral-900">{row.invoiceCode}</span>
                </Td>
                <Td>
                  <p className="font-semibold text-neutral-900">{row.title}</p>
                  <p className="text-xs text-neutral-500">{row.customerName}</p>
                </Td>
                <Td>
                  <ServicePill className={getInvoiceStatusTone(row.invoiceStatus)}>
                    {getInvoiceStatusLabel(row.invoiceStatus)}
                  </ServicePill>
                </Td>
                <Td>
                  <span className="font-semibold text-neutral-900">
                    {formatServiceMoney(row.paidAmount)}
                  </span>
                </Td>
                <Td>{formatServiceMoney(row.total)}</Td>
                <Td>{row.dueDate}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-900"
                        style={{ width: `${row.collectionRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-neutral-500">
                      {row.collectionRate}%
                    </span>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ServiceSectionCard>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-neutral-500">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-neutral-700">{children}</td>;
}
