"use client";

import { useCallback, useEffect, useRef } from "react";

import {
  financialReportBases,
  isFinancialReportBasis,
  type FinancialReportBasis,
} from "@/lib/api/financial-reports-api";

import {
  getFinancialReportsPeriodOptions,
  resolveFinancialReportsPeriodContext,
  writeFinancialReportsPeriodContext,
} from "./financial-reports-period-sync";

function readSelectValue(values: string[]) {
  if (typeof document === "undefined") return null;

  const selects = Array.from(document.querySelectorAll("select"));
  const matchingSelect = selects.find((select) => values.includes(select.value));

  return matchingSelect?.value ?? null;
}

export function FinancialReportsPeriodSyncObserver() {
  const lastSignatureRef = useRef<string | null>(null);

  const publishCurrentPeriod = useCallback(() => {
    const periodLabels = getFinancialReportsPeriodOptions().map(
      (option) => option.label,
    );
    const periodLabel = readSelectValue(periodLabels);
    const basisValue = readSelectValue([...financialReportBases]);
    const basis: FinancialReportBasis | null = isFinancialReportBasis(basisValue)
      ? basisValue
      : null;
    const context = resolveFinancialReportsPeriodContext({
      label: periodLabel,
      basis,
    });
    const signature = `${context.label}:${context.from}:${context.to}:${context.basis}`;

    if (signature === lastSignatureRef.current) return;

    lastSignatureRef.current = signature;
    writeFinancialReportsPeriodContext(context);
  }, []);

  useEffect(() => {
    publishCurrentPeriod();

    const handleChange = (event: Event) => {
      if (event.target instanceof HTMLSelectElement) {
        publishCurrentPeriod();
      }
    };

    const mutationObserver = new MutationObserver(() => {
      publishCurrentPeriod();
    });

    document.addEventListener("change", handleChange);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      document.removeEventListener("change", handleChange);
      mutationObserver.disconnect();
    };
  }, [publishCurrentPeriod]);

  return null;
}
