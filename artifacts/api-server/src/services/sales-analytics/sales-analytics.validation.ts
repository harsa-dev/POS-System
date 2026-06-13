import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import {
  salesAnalyticsBases,
  salesAnalyticsExportFormats,
  salesAnalyticsPaidOrderStatuses,
  salesAnalyticsSortDirections,
  salesAnalyticsSortKeys,
  type SalesAnalyticsBasis,
  type SalesAnalyticsExportFormat,
  type SalesAnalyticsOrderStatus,
  type SalesAnalyticsQuery,
  type SalesAnalyticsSortDirection,
  type SalesAnalyticsSortKey,
} from "./sales-analytics.types.js";

const MAX_ANALYTICS_RANGE_DAYS = 400;
const DEFAULT_ANALYTICS_PAGE = 1;
const DEFAULT_ANALYTICS_PAGE_SIZE = 10;
const MAX_ANALYTICS_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 80;
const MAX_FILTER_VALUE_LENGTH = 80;
const MAX_PAYMENT_METHOD_LENGTH = 32;

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

function parseOptionalString(value: unknown, field: string, maxLength = MAX_FILTER_VALUE_LENGTH) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `Invalid ${field}.`,
    });
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;

  if (trimmed.length > maxLength) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `${field} cannot exceed ${maxLength} characters.`,
    });
  }

  return trimmed;
}

function parseSearch(value: unknown) {
  return parseOptionalString(value, "q", MAX_SEARCH_LENGTH);
}

function parsePaymentMethod(value: unknown) {
  const paymentMethod = parseOptionalString(
    value,
    "paymentMethod",
    MAX_PAYMENT_METHOD_LENGTH,
  );

  return paymentMethod?.toUpperCase();
}

function parseOrderStatus(value: unknown): SalesAnalyticsOrderStatus | undefined {
  const orderStatus = parseOptionalString(value, "orderStatus");
  if (!orderStatus) return undefined;

  const normalized = orderStatus.toUpperCase();
  if (
    salesAnalyticsPaidOrderStatuses.includes(
      normalized as SalesAnalyticsOrderStatus,
    )
  ) {
    return normalized as SalesAnalyticsOrderStatus;
  }

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "Invalid sales analytics orderStatus filter.",
    details: { allowedValues: salesAnalyticsPaidOrderStatuses },
  });
}

function parsePositiveInteger(params: {
  value: unknown;
  field: string;
  fallback: number;
  max?: number;
}) {
  const { value, field, fallback, max } = params;
  if (value === undefined || value === null || value === "") return fallback;

  const raw = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(raw) || raw < 1 || (max !== undefined && raw > max)) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message:
        max === undefined
          ? `${field} must be a positive integer.`
          : `${field} must be between 1 and ${max}.`,
    });
  }

  return raw;
}

function parsePage(value: unknown) {
  return parsePositiveInteger({
    value,
    field: "page",
    fallback: DEFAULT_ANALYTICS_PAGE,
  });
}

function parsePageSize(rawQuery: Record<string, unknown>) {
  return parsePositiveInteger({
    value: rawQuery.pageSize ?? rawQuery.limit,
    field: "pageSize",
    fallback: DEFAULT_ANALYTICS_PAGE_SIZE,
    max: MAX_ANALYTICS_PAGE_SIZE,
  });
}

function parseSortBy(value: unknown): SalesAnalyticsSortKey {
  if (value === undefined || value === null || value === "") return "date";
  if (typeof value === "string" && salesAnalyticsSortKeys.includes(value as SalesAnalyticsSortKey)) {
    return value as SalesAnalyticsSortKey;
  }

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "Invalid sales analytics sortBy filter.",
    details: { allowedValues: salesAnalyticsSortKeys },
  });
}

function parseSortDirection(value: unknown): SalesAnalyticsSortDirection {
  if (value === undefined || value === null || value === "") return "desc";
  if (
    typeof value === "string" &&
    salesAnalyticsSortDirections.includes(value.toLowerCase() as SalesAnalyticsSortDirection)
  ) {
    return value.toLowerCase() as SalesAnalyticsSortDirection;
  }

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "Invalid sales analytics sortDirection filter.",
    details: { allowedValues: salesAnalyticsSortDirections },
  });
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

export function parseSalesAnalyticsExportFormat(
  value: unknown,
): SalesAnalyticsExportFormat {
  if (value === undefined || value === null || value === "") return "json";

  if (
    typeof value === "string" &&
    salesAnalyticsExportFormats.includes(value as SalesAnalyticsExportFormat)
  ) {
    return value as SalesAnalyticsExportFormat;
  }

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "Invalid sales analytics export format.",
    details: { allowedValues: salesAnalyticsExportFormats },
  });
}

export function parseSalesAnalyticsQuery(rawQuery: Record<string, unknown>): SalesAnalyticsQuery {
  const from = parseDate(rawQuery.from, "from", startOfCurrentMonth());
  const to = parseDate(rawQuery.to, "to", endOfToday());
  const basis = parseBasis(rawQuery.basis);
  const productId = parseOptionalString(rawQuery.productId, "productId");
  const categoryId = parseOptionalString(rawQuery.categoryId, "categoryId");
  const paymentMethod = parsePaymentMethod(rawQuery.paymentMethod);
  const orderStatus = parseOrderStatus(rawQuery.orderStatus);
  const q = parseSearch(rawQuery.q);
  const page = parsePage(rawQuery.page);
  const pageSize = parsePageSize(rawQuery);
  const sortBy = parseSortBy(rawQuery.sortBy);
  const sortDirection = parseSortDirection(rawQuery.sortDirection);

  assertDateRange(from, to);

  return {
    from,
    to,
    basis,
    productId,
    categoryId,
    paymentMethod,
    orderStatus,
    q,
    page,
    pageSize,
    sortBy,
    sortDirection,
  };
}
