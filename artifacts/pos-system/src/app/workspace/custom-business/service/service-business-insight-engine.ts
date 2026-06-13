import {
  calculateCollectionRate,
  calculateCostBase,
  calculateGrossProfit,
  calculateQuoteTotal,
} from "./service-business-workspace-domain";
import { getNextServiceStatuses } from "./service-business-status-transitions";
import {
  countMetTransitionRequirements,
  getServiceTransitionRequirements,
} from "./service-business-transition-requirements";
import type { ServiceBusinessJob } from "./service-business-workspace-types";

export type ServiceBusinessInsightSeverity = "positive" | "neutral" | "warning" | "critical";

export type ServiceBusinessInsightSignal = {
  id: string;
  label: string;
  description: string;
  severity: ServiceBusinessInsightSeverity;
};

export type ServiceBusinessInsightSummary = {
  readinessScore: number;
  riskScore: number;
  grossProfitRate: number;
  collectionRate: number;
  nextRequirementScore: number;
  signals: readonly ServiceBusinessInsightSignal[];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function signal(
  id: string,
  label: string,
  description: string,
  severity: ServiceBusinessInsightSeverity,
): ServiceBusinessInsightSignal {
  return {
    id,
    label,
    description,
    severity,
  };
}

function getNextRequirementScore(job: ServiceBusinessJob) {
  const nextStatuses = getNextServiceStatuses(job.status);

  if (nextStatuses.length === 0) return 100;

  const requirements = nextStatuses.flatMap((status) =>
    getServiceTransitionRequirements(job, status),
  );

  if (requirements.length === 0) return 100;

  return clampScore((countMetTransitionRequirements(requirements) / requirements.length) * 100);
}

function getGrossProfitRate(job: ServiceBusinessJob) {
  const quoteTotal = calculateQuoteTotal(job);

  if (quoteTotal <= 0) return 0;

  return clampScore((calculateGrossProfit(job) / quoteTotal) * 100);
}

export function getServiceBusinessInsightSummary(
  job: ServiceBusinessJob,
): ServiceBusinessInsightSummary {
  const quoteTotal = calculateQuoteTotal(job);
  const costBase = calculateCostBase(job.costLines);
  const grossProfit = calculateGrossProfit(job);
  const grossProfitRate = getGrossProfitRate(job);
  const collectionRate = calculateCollectionRate(job.invoice, quoteTotal);
  const nextRequirementScore = getNextRequirementScore(job);
  const signals: ServiceBusinessInsightSignal[] = [];

  if (job.priority === "URGENT") {
    signals.push(
      signal(
        "urgent-priority",
        "Urgent priority",
        "This job should stay visible in operational review until it is delivered or closed.",
        "critical",
      ),
    );
  } else if (job.priority === "HIGH") {
    signals.push(
      signal(
        "high-priority",
        "High priority",
        "This job has elevated operational attention but is not marked urgent.",
        "warning",
      ),
    );
  }

  if (costBase <= 0) {
    signals.push(
      signal(
        "missing-cost-base",
        "Missing cost base",
        "No service cost has been captured yet, so margin preview is incomplete.",
        "warning",
      ),
    );
  }

  if (quoteTotal <= 0) {
    signals.push(
      signal(
        "missing-quote-total",
        "Quote total unavailable",
        "The quotation total is zero, so revenue and collection readiness cannot be trusted.",
        "warning",
      ),
    );
  }

  if (grossProfit < 0) {
    signals.push(
      signal(
        "negative-margin",
        "Negative gross profit",
        "The current cost preview is higher than the quote total.",
        "critical",
      ),
    );
  } else if (grossProfitRate < 20 && quoteTotal > 0) {
    signals.push(
      signal(
        "low-margin",
        "Low gross profit rate",
        "The current gross profit rate is below the draft service target threshold.",
        "warning",
      ),
    );
  } else if (quoteTotal > 0) {
    signals.push(
      signal(
        "healthy-margin",
        "Healthy gross profit preview",
        "The current quote and cost preview has a usable gross profit buffer.",
        "positive",
      ),
    );
  }

  if (["INVOICED", "PAID", "CLOSED"].includes(job.status) && collectionRate < 100) {
    signals.push(
      signal(
        "collection-not-complete",
        "Collection not complete",
        "The job is in a billing or closing phase but collection is not complete.",
        "warning",
      ),
    );
  }

  if (nextRequirementScore < 100) {
    signals.push(
      signal(
        "next-requirements-missing",
        "Next action has missing requirements",
        "The next transition is not fully ready according to the frontend preview rules.",
        "warning",
      ),
    );
  } else {
    signals.push(
      signal(
        "next-requirements-ready",
        "Next action requirements ready",
        "The next transition requirements are satisfied in the current preview.",
        "positive",
      ),
    );
  }

  if (job.checklist.length === 0) {
    signals.push(
      signal(
        "missing-checklist",
        "Checklist missing",
        "No execution checklist is attached to this service job.",
        "warning",
      ),
    );
  }

  const criticalCount = signals.filter((item) => item.severity === "critical").length;
  const warningCount = signals.filter((item) => item.severity === "warning").length;
  const positiveCount = signals.filter((item) => item.severity === "positive").length;
  const riskScore = clampScore(criticalCount * 35 + warningCount * 15 - positiveCount * 5);
  const readinessScore = clampScore(
    nextRequirementScore * 0.45 +
      collectionRate * 0.2 +
      Math.min(grossProfitRate, 40) * 0.75 +
      (job.checklist.length > 0 ? 15 : 0) -
      riskScore * 0.25,
  );

  return {
    readinessScore,
    riskScore,
    grossProfitRate,
    collectionRate,
    nextRequirementScore,
    signals,
  };
}
