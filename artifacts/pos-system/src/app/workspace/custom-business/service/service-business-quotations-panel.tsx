import {
  calculateQuoteTotal,
  formatServiceMoney,
  getQuoteStatusLabel,
  getServiceStatusLabel,
} from "./service-business-workspace-domain";
import type { ServiceBusinessJob } from "./service-business-workspace-types";
import { ServicePill, ServiceSectionCard } from "./service-business-workspace-ui";

function getQuoteStatusTone(status: string) {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "draft") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "sent") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "rejected" || status === "expired")
    return "border-red-200 bg-red-50 text-red-700";
  return "border-neutral-200 bg-neutral-50 text-neutral-700";
}

export function ServiceBusinessQuotationsPanel({
  jobs,
}: {
  jobs: readonly ServiceBusinessJob[];
}) {
  const rows = jobs.map((job) => ({
    jobId: job.id,
    requestCode: job.requestCode,
    title: job.title,
    customerName: job.customerName,
    quoteCode: job.quote.code,
    quoteStatus: job.quote.status,
    quoteTotal: calculateQuoteTotal(job),
    validUntil: job.quote.validUntil,
    jobStatus: job.status,
  }));

  if (rows.length === 0) {
    return (
      <ServiceSectionCard
        title="Quotations"
        description="Quotations attached to service jobs. A new quotation is generated from the job action panel."
      >
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
          No service jobs found. Create a request to get started.
        </div>
      </ServiceSectionCard>
    );
  }

  return (
    <ServiceSectionCard
      title="Quotations"
      description="Quotations attached to service jobs. A new quotation is generated from the job action panel."
    >
      <div className="overflow-x-auto rounded-2xl border border-neutral-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-left">
              <Th>Quote</Th>
              <Th>Job / Customer</Th>
              <Th>Status</Th>
              <Th>Total</Th>
              <Th>Valid until</Th>
              <Th>Job stage</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.jobId} className="border-b border-neutral-100 last:border-0">
                <Td>
                  <span className="font-semibold text-neutral-900">{row.quoteCode}</span>
                </Td>
                <Td>
                  <p className="font-semibold text-neutral-900">{row.title}</p>
                  <p className="text-xs text-neutral-500">{row.customerName}</p>
                </Td>
                <Td>
                  <ServicePill className={getQuoteStatusTone(row.quoteStatus)}>
                    {getQuoteStatusLabel(row.quoteStatus)}
                  </ServicePill>
                </Td>
                <Td>
                  <span className="font-semibold text-neutral-900">
                    {formatServiceMoney(row.quoteTotal)}
                  </span>
                </Td>
                <Td>{row.validUntil}</Td>
                <Td>
                  <span className="text-neutral-500">{getServiceStatusLabel(row.jobStatus)}</span>
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
