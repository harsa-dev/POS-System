import { StatusPill } from "@/features/shared/cards";
import type { InvoicePaymentStatus } from "@/features/shared/types";

function getStatusTone(status: InvoicePaymentStatus) {
  if (status === "Paid") return "green";
  if (status === "Waiting For Payment") return "amber";

  return "rose";
}

export function InvoiceStatus({ status }: { status: InvoicePaymentStatus }) {
  return <StatusPill tone={getStatusTone(status)}>{status}</StatusPill>;
}
