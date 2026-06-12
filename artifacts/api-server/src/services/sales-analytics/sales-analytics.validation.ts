import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import {
  salesAnalyticsBases,
  type SalesAnalyticsBasis,
  type SalesAnalyticsQuery,
} from "./sales-analytics.types.js";

const MAX_ANALYTICS_RANGE_DAYS = 400;
const DEFAULT_ANALYTICS_ROW_LIMIT = 50;
const MAX_ANALYTICS_ROW_LIMIT = 100;
const MAX_SEARCH_LENGTH = 80;

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

function parseBasis(value: unknown): SalesAnalyticsBasis {
  if (value === undefined || value === null || value === "") return "paid";
  if (typeof value === "string" && salesAnalyticsBases.includes(value as SalesAnalyticsBasis)) {
    return value as SalesAnalyticsBasis;
  }

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "Invalid sales analytics basis.",
    details: { allowedValues: salesAnalyticsBases },
  });
}

function parseOptionalString(value: unknown, field: string) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `Invalid ${field}.`,
    });
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseSearch(value: unknown) {
  const search = parseOptionalString(value, "q");
  if (!search) return undefined;

  if (search.length > MAX_SEARCH_LENGTH) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `Search cannot exceed ${MAX_SEARCH_LENGTH} characters.`,
    });
  }

  return search;
}

function parseLimit(value: unknown) {
  if (value === undefined || value === null || value === "") return DEFAULT_ANALYTICS_ROW_LIMIT;

  const raw = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(raw) || raw < 1 || raw > MAX_ANALYTICS_ROW_LIMIT) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `Limit must be between 1 and ${MAX_ANALYTICS_ROW_LIMIT}.`,
    });
  }

  return raw;
}

function assertDateRange(from: Date, to: Date) {
  if (from > to) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: "Analytics start date must be before end date.",
    });
  }

  const diffDays = Math.ceil((to.getTime() - from.getTime()) / 86_400_000);
  if (diffDays > MAX_ANALYTICS_RANGE_DAYS) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `Sales analytics range cannot exceed ${MAX_ANALYTICS_RANGE_DAYS} days.`,
    });
  }
}

export function parseSalesAnalyticsQuery(rawQuery: Record<string, unknown>): SalesAnalyticsQuery {
  const from = parseDate(rawQuery.from, "from", startOfCurrentMonth());
  const to = parseDate(rawQuery.to, "to", endOfToday());
  const basis = parseBasis(rawQuery.basis);
  const productId = parseOptionalString(rawQuery.productId, "productId");
  const q = parseSearch(rawQuery.q);
  const limit = parseLimit(rawQuery.limit);

  assertDateRange(from, to);

  return {
    from,
    to,
    basis,
    productId,
    q,
    limit,
  };
}
