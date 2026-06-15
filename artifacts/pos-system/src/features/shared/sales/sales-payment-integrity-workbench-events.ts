import type { SalesPaymentIntegrityIssue } from "@/lib/api/sales-payment-integrity-api";

export const SALES_PAYMENT_INTEGRITY_OPEN_EVENT = "sales-payment-integrity:open";

export type SalesPaymentIntegrityOpenEventDetail = {
  issue?: SalesPaymentIntegrityIssue;
  message?: string;
};

export function openSalesPaymentIntegrityWorkbench(detail: SalesPaymentIntegrityOpenEventDetail) {
  window.dispatchEvent(new CustomEvent(SALES_PAYMENT_INTEGRITY_OPEN_EVENT, { detail }));
  document
    .getElementById("sales-payment-integrity-workbench")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}
