import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import {
  cashflowAccounts,
  cashflowEntryStatuses,
  cashflowEntryTypes,
  cashflowSourceTypes,
  type CashflowAccount,
  type CashflowEntryStatus,
  type CashflowEntryType,
  type CashflowQuery,
  type CashflowSourceType,
  type CreateCashflowEntryInput,
  type ParsedCreateCashflowEntryInput,
} from "./cashflow.types.js";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseString(value: unknown, field: string, required = true) {
  if (typeof value !== "string") {
    if (!required && value === undefined) return undefined;
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `${field} is required.`,
    });
  }

  const trimmed = value.trim();
  if (!trimmed && required) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `${field} is required.`,
    });
  }

  return trimmed || undefined;
}

function parseEnum<TValue extends string>(
  value: unknown,
  values: readonly TValue[],
  field: string
): TValue {
  if (typeof value === "string" && values.includes(value as TValue)) {
    return value as TValue;
  }

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: `Invalid ${field}.`,
    details: { field, allowedValues: values },
  });
}

function parseOptionalEnum<TValue extends string>(
  value: unknown,
  values: readonly TValue[],
  field: string
): TValue | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return parseEnum(value, values, field);
}

function parseDate(value: unknown, field: string, fallback?: Date) {
  if (value === undefined || value === null || value === "") return fallback;

  if (typeof value !== "string") {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `Invalid ${field}.`,
    });
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `Invalid ${field}.`,
    });
  }

  return parsed;
}

function parsePositiveInteger(value: unknown, field: string) {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.invalidCashflowAmount,
      message: `${field} must be a positive integer.`,
    });
  }

  return numericValue;
}

function parsePage(value: unknown) {
  const numericValue = Number(value ?? DEFAULT_PAGE);
  if (!Number.isInteger(numericValue) || numericValue < 1) return DEFAULT_PAGE;
  return numericValue;
}

function parseLimit(value: unknown) {
  const numericValue = Number(value ?? DEFAULT_LIMIT);
  if (!Number.isInteger(numericValue) || numericValue < 1) return DEFAULT_LIMIT;
  return Math.min(numericValue, MAX_LIMIT);
}

export function parseCashflowQuery(query: Record<string, unknown>): CashflowQuery {
  const from = parseDate(query.from, "from");
  const to = parseDate(query.to, "to");

  return {
    from,
    to,
    account: parseOptionalEnum(query.account, cashflowAccounts, "account"),
    type: parseOptionalEnum(query.type, cashflowEntryTypes, "type"),
    status: parseOptionalEnum(query.status, cashflowEntryStatuses, "status"),
    sourceType: parseOptionalEnum(query.sourceType, cashflowSourceTypes, "sourceType"),
    search: parseString(query.search, "search", false),
    page: parsePage(query.page),
    limit: parseLimit(query.limit),
  };
}

export function parseCreateCashflowEntryInput(
  input: CreateCashflowEntryInput | unknown
): ParsedCreateCashflowEntryInput {
  if (!isRecord(input)) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: "Invalid cashflow payload.",
    });
  }

  return {
    account: parseEnum(input.account, cashflowAccounts, "account"),
    type: parseEnum(input.type, cashflowEntryTypes, "type"),
    status: parseOptionalEnum(input.status, cashflowEntryStatuses, "status") ?? "POSTED",
    category: parseString(input.category, "category") ?? "Manual",
    counterpartyName: parseString(input.counterpartyName, "counterpartyName", false),
    description: parseString(input.description, "description", false),
    amount: parsePositiveInteger(input.amount, "amount"),
    occurredAt: parseDate(input.occurredAt, "occurredAt", new Date()) ?? new Date(),
  };
}

export function assertManualEntryType(type: CashflowEntryType) {
  if (type === "TRANSFER_IN" || type === "TRANSFER_OUT") return;
  if (type === "INCOME" || type === "EXPENSE" || type === "ADJUSTMENT") return;

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: "Invalid cashflow entry type.",
  });
}

export function assertEntryCanBeVoided(status: CashflowEntryStatus) {
  if (status !== "POSTED" && status !== "PENDING") {
    throw new AppError({
      statusCode: 409,
      code: errorCodes.invalidCashflowStatus,
      message: "Only pending or posted cashflow entries can be voided.",
    });
  }
}

export function mapPaymentMethodToAccount(paymentMethod: string): CashflowAccount {
  const normalized = paymentMethod.toUpperCase();

  if (normalized.includes("CASH")) return "CASH";
  if (normalized.includes("QRIS")) return "QRIS";
  if (normalized.includes("CARD")) return "CARD";
  if (normalized.includes("TRANSFER")) return "TRANSFER";
  if (normalized.includes("BANK")) return "BANK";

  return "OTHER";
}

export type {
  CashflowAccount,
  CashflowEntryStatus,
  CashflowEntryType,
  CashflowSourceType,
};
