"use client";

import { useEffect } from "react";

import { consumeInvoiceGeneratorDrilldown } from "@/features/shared/financial-reports/financial-reports-drilldown-bridge";

import {
  INVOICE_GENERATOR_FILTER_HISTORY_EVENT,
  INVOICE_GENERATOR_LOAD_INVOICE_EVENT,
  type InvoiceGeneratorFilterHistoryEventDetail,
  type InvoiceGeneratorLoadInvoiceEventDetail,
} from "./invoice-generator-events";

export function InvoiceFinancialReportBridge() {
  useEffect(() => {
    const payload = consumeInvoiceGeneratorDrilldown();
    if (!payload) return;

    const filterDetail: InvoiceGeneratorFilterHistoryEventDetail = {
      search: payload.search ?? payload.invoiceNumber ?? "",
      status: payload.status ?? "ALL",
      from: payload.from,
      to: payload.to,
      overdue: payload.overdue,
      message: payload.message ?? "Invoice history opened from Financial Reports.",
    };

    window.dispatchEvent(
      new CustomEvent(INVOICE_GENERATOR_FILTER_HISTORY_EVENT, {
        detail: filterDetail,
      }),
    );

    if (payload.invoiceId) {
      const loadDetail: InvoiceGeneratorLoadInvoiceEventDetail = {
        invoiceId: payload.invoiceId,
        invoiceNumber: payload.invoiceNumber,
      };

      window.dispatchEvent(
        new CustomEvent(INVOICE_GENERATOR_LOAD_INVOICE_EVENT, {
          detail: loadDetail,
        }),
      );
    }
  }, []);

  return null;
}
