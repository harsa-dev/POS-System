import { StatusPill } from "@/features/shared/cards";
import { getInvoiceStatusMetadata } from "../data/invoice-status";
import type { InvoicePaymentStatus } from "@/features/shared/types";

export function InvoiceStatus({ status }: { status: InvoicePaymentStatus }) {
  const metadata = getInvoiceStatusMetadata(status);

  return <StatusPill tone={metadata.tone}>{metadata.label}</StatusPill>;
}
