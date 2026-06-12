export const cashflowEntryTypes = [
  "INCOME",
  "EXPENSE",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "ADJUSTMENT",
] as const;

export type CashflowEntryType = (typeof cashflowEntryTypes)[number];

export const cashflowEntryStatuses = ["PENDING", "POSTED", "VOIDED"] as const;

export type CashflowEntryStatus = (typeof cashflowEntryStatuses)[number];

export const cashflowAccounts = [
  "CASH",
  "BANK",
  "QRIS",
  "CARD",
  "TRANSFER",
  "OTHER",
] as const;

export type CashflowAccount = (typeof cashflowAccounts)[number];

export const cashflowSourceTypes = [
  "ORDER_PAYMENT",
  "PAYMENT_WEBHOOK",
  "SHIFT_CLOSE",
  "INVOICE",
  "MANUAL",
  "INVENTORY_PURCHASE",
  "REFUND",
  "SYSTEM",
] as const;

export type CashflowSourceType = (typeof cashflowSourceTypes)[number];

export type CashflowActor = {
  id: string;
  role: import("@prisma/client").Role;
};

export type CashflowEntryRecord = {
  id: string;
  businessId: string | null;
  restaurantId: string;
  sourceType: CashflowSourceType;
  sourceId: string | null;
  idempotencyKey: string | null;
  account: CashflowAccount;
  type: CashflowEntryType;
  status: CashflowEntryStatus;
  category: string;
  counterpartyName: string | null;
  description: string | null;
  amount: number;
  occurredAt: Date;
  postedAt: Date | null;
  voidedAt: Date | null;
  createdById: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type CashflowEntryDto = Omit<
  CashflowEntryRecord,
  "occurredAt" | "postedAt" | "voidedAt" | "createdAt" | "updatedAt"
> & {
  occurredAt: string;
  postedAt: string | null;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CashflowQuery = {
  from?: Date;
  to?: Date;
  account?: CashflowAccount;
  type?: CashflowEntryType;
  status?: CashflowEntryStatus;
  sourceType?: CashflowSourceType;
  search?: string;
  page: number;
  limit: number;
};

export type CreateCashflowEntryInput = {
  account?: unknown;
  type?: unknown;
  status?: unknown;
  category?: unknown;
  counterpartyName?: unknown;
  description?: unknown;
  amount?: unknown;
  occurredAt?: unknown;
};

export type ParsedCreateCashflowEntryInput = {
  account: CashflowAccount;
  type: CashflowEntryType;
  status: CashflowEntryStatus;
  category: string;
  counterpartyName?: string;
  description?: string;
  amount: number;
  occurredAt: Date;
};

export type CashflowDashboardDto = {
  summary: {
    totalIncome: number;
    totalExpense: number;
    currentBalance: number;
    pendingAmount: number;
    postedCount: number;
    voidedCount: number;
  };
  trend: Array<{
    period: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  incomeSources: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  expenseSources: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  recentEntries: CashflowEntryDto[];
};
