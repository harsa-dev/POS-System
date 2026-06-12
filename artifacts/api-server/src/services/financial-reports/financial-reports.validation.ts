import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import {
  financialReportBases,
  type FinancialReportBasis,
  type FinancialReportQuery,
} from "./financial-reports.types.js";

const MAX_REPORT_RANGE_DAYS = 400;

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function startOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function endOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

function parseDate(value: unknown, field: string, fallback: Date) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `Invalid ${field}.`,
    });
  }

  const parsed = new Date(value);
  if (!isValidDate(parsed)) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `Invalid ${field}.`,
    });
  }

  return parsed;
}

function parseBasis(value: unknown): FinancialReportBasis {
  if (value === undefined || value === null || value === "") return "hybrid";
  if (typeof value === "string" && financialReportBases.includes(value as FinancialReportBasis)) {
    return value as FinancialReportBasis;
  }

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "Invalid financial report basis.",
    details: { allowedValues: financialReportBases },
  });
}

function assertDateRange(from: Date, to: Date) {
  if (from > to) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: "Report start date must be before end date.",
    });
  }

  const diffDays = Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
  if (diffDays > MAX_REPORT_RANGE_DAYS) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `Financial report range cannot exceed ${MAX_REPORT_RANGE_DAYS} days.`,
    });
  }
}

export function parseFinancialReportQuery(rawQuery: Record<string, unknown>): FinancialReportQuery {
  const from = parseDate(rawQuery.from, "from", startOfCurrentMonth());
  const to = parseDate(rawQuery.to, "to", endOfToday());
  const basis = parseBasis(rawQuery.basis);

  assertDateRange(from, to);

  return { from, to, basis };
}
