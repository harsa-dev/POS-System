import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export type CashflowEntryType =
  | "INCOME"
  | "EXPENSE"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "ADJUSTMENT";

export type CashflowEntryStatus = "PENDING" | "POSTED" | "VOIDED";

export type CashflowAccount = "CASH" | "BANK" | "QRIS" | "CARD" | "TRANSFER" | "OTHER";

export type CashflowSourceType =
  | "ORDER_PAYMENT"
  | "PAYMENT_WEBHOOK"
  | "SHIFT_CLOSE"
  | "INVOICE"
  | "MANUAL"
  | "INVENTORY_PURCHASE"
  | "REFUND"
  | "SYSTEM";

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

type ApiListEnvelope<T> = ApiEnvelope<T> & {
  data: T;
  meta?: {
    pagination?: {
      page?: number;
      limit: number;
      totalItems?: number;
      totalPages?: number;
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
      nextCursor?: string | null;
    };
  };
};

export type CashflowEntryDto = {
  id: string;
  businessId: string;
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
  occurredAt: string;
  postedAt: string | null;
  voidedAt: string | null;
  createdById: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
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

export type CashflowQuery = {
  from?: string;
  to?: string;
  account?: CashflowAccount;
  type?: CashflowEntryType;
  status?: CashflowEntryStatus;
  sourceType?: CashflowSourceType;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateCashflowEntryPayload = {
  account: CashflowAccount;
  type: CashflowEntryType;
  status?: CashflowEntryStatus;
  category: string;
  counterpartyName?: string;
  description?: string;
  amount: number;
  occurredAt?: string;
};

function buildCashflowQuery(params?: CashflowQuery) {
  if (!params) return "";

  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  if (params.account) searchParams.set("account", params.account);
  if (params.type) searchParams.set("type", params.type);
  if (params.status) searchParams.set("status", params.status);
  if (params.sourceType) searchParams.set("sourceType", params.sourceType);
  if (params.search) searchParams.set("search", params.search);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const cashflowApi = {
  getDashboard(params?: CashflowQuery) {
    return apiClient.get<ApiDataEnvelope<CashflowDashboardDto>>(
      `/api/cashflow-dashboard${buildCashflowQuery(params)}`,
    );
  },

  listEntries(params?: CashflowQuery) {
    return apiClient.get<ApiListEnvelope<CashflowEntryDto[]>>(
      `/api/cashflow-entries${buildCashflowQuery(params)}`,
    );
  },

  createEntry(payload: CreateCashflowEntryPayload) {
    return apiClient.post<ApiDataEnvelope<CashflowEntryDto>>("/api/cashflow-entries", {
      json: payload,
    });
  },

  syncOrder(orderId: string) {
    return apiClient.post<ApiDataEnvelope<CashflowEntryDto>>(
      `/api/cashflow/sync/orders/${encodeURIComponent(orderId)}`,
    );
  },

  syncShift(shiftId: string) {
    return apiClient.post<ApiDataEnvelope<CashflowEntryDto>>(
      `/api/cashflow/sync/shifts/${encodeURIComponent(shiftId)}`,
    );
  },

  voidEntry(id: string) {
    return apiClient.patch<ApiDataEnvelope<CashflowEntryDto>>(
      `/api/cashflow-entries/${encodeURIComponent(id)}/void`,
    );
  },
};
