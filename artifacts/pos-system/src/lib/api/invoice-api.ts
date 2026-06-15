import { apiClient, apiFetch, type ApiEnvelope } from "@/lib/api/api-client";
import { readApiEnvelope } from "@/lib/api/read-api-envelope";

type ApiRecord = Record<string, unknown>;

export type InvoiceBackendStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";
export type InvoiceLifecycleStatus = "SENT" | "PAID";
export type InvoiceDiscountType = "PERCENTAGE" | "FIXED";
export type InvoiceFollowUpStatus =
  | "CONTACTED"
  | "WAITING_RESPONSE"
  | "PROMISED_PAYMENT"
  | "RESOLVED"
  | "ESCALATED";
export type InvoiceFollowUpReminderScope = "due" | "upcoming" | "all";

export type InvoiceCapabilitiesDto = {
  businessId: string;
  businessMode: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canCancel: boolean;
  canPrint: boolean;
  isPlannedMode: boolean;
  plannedReason: string | null;
};

export type InvoiceHistoryQuery = {
  search?: string;
  status?: InvoiceBackendStatus | "ALL";
  from?: string;
  to?: string;
  overdue?: boolean;
  page?: number;
  limit?: number;
};

export type InvoiceHistoryMeta = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type InvoiceHistoryEnvelope<T = InvoiceRecord[]> = ApiEnvelope<T> & {
  meta?: InvoiceHistoryMeta;
};

export type InvoiceSummaryBucketDto = {
  status: InvoiceBackendStatus;
  count: number;
  total: number;
};

export type InvoiceAgingBucketDto = {
  id: "1-7" | "8-30" | "31-60" | "61+";
  label: string;
  minDays: number;
  maxDays: number | null;
  count: number;
  total: number;
};

export type InvoiceOverdueSampleDto = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  status: Extract<InvoiceBackendStatus, "DRAFT" | "SENT">;
  dueDate: string | null;
  daysOverdue: number;
  grandTotal: number;
};

export type InvoiceSummaryDto = {
  buckets: InvoiceSummaryBucketDto[];
  totals: {
    totalCount: number;
    totalValue: number;
    receivable: number;
    paidRevenue: number;
    cancelledValue: number;
    draftValue: number;
    sentValue: number;
    overdueValue: number;
    currentReceivable: number;
  };
  aging: {
    asOf: string;
    overdueCount: number;
    overdueValue: number;
    draftOverdueCount: number;
    draftOverdueValue: number;
    sentOverdueCount: number;
    sentOverdueValue: number;
    oldestOverdueDays: number;
    buckets: InvoiceAgingBucketDto[];
    samples: InvoiceOverdueSampleDto[];
  };
  lastUpdatedAt: string | null;
};

export type InvoiceFollowUpDto = {
  id: string;
  businessId: string;
  invoiceId: string;
  status: InvoiceFollowUpStatus;
  note: string;
  nextFollowUpAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceFollowUpDashboardItemDto = {
  invoice: InvoiceOverdueSampleDto;
  latestFollowUp: InvoiceFollowUpDto | null;
};

export type InvoiceFollowUpSummaryDto = {
  overdueCount: number;
  withFollowUpCount: number;
  withoutFollowUpCount: number;
  unresolvedCount: number;
  statusCounts: Record<InvoiceFollowUpStatus, number>;
};

export type InvoiceFollowUpDashboardDto = {
  items: InvoiceFollowUpDashboardItemDto[];
  summary: InvoiceFollowUpSummaryDto;
};

export type InvoiceFollowUpReminderDto = {
  invoice: InvoiceOverdueSampleDto;
  followUp: InvoiceFollowUpDto;
  reminder: {
    nextFollowUpAt: string;
    isDue: boolean;
    daysLate: number;
    daysUntil: number;
  };
};

export type InvoiceFollowUpReminderSummaryDto = {
  asOf: string;
  totalReminderCount: number;
  dueCount: number;
  upcomingCount: number;
  oldestDueDays: number;
  nextUpcomingAt: string | null;
};

export type InvoiceFollowUpReminderDashboardDto = {
  items: InvoiceFollowUpReminderDto[];
  summary: InvoiceFollowUpReminderSummaryDto;
  scope: InvoiceFollowUpReminderScope;
  limit: number;
};

export type InvoiceFollowUpReminderQuery = {
  scope?: InvoiceFollowUpReminderScope;
  limit?: number;
};

export type InvoiceFollowUpPayload = {
  status: InvoiceFollowUpStatus;
  note: string;
  nextFollowUpAt?: string | null;
};

export type InvoiceExportDto = {
  rows: InvoiceRecord[];
  meta: {
    exportedAt: string;
    rowCount: number;
    limit: number;
  };
};

export type InvoiceCsvDownload = {
  blob: Blob;
  filename: string;
  rowCount: number | null;
  exportedAt: string | null;
};

export type InvoicePayload = {
  status?: InvoiceBackendStatus;
  business: {
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  };
  customer: {
    name: string;
    phone?: string | null;
    address?: string | null;
  };
  billing: {
    invoiceNumber?: string;
    invoiceDate: string;
    dueDate?: string | null;
  };
  discount: {
    type: InvoiceDiscountType;
    value: number;
  };
  notes?: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export type InvoiceRecord = {
  id: string;
  businessId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  status: InvoiceBackendStatus;
  businessName: string;
  businessEmail: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  notes: string | null;
  discountType: InvoiceDiscountType;
  discountValue: number;
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  items: Array<{
    id: string;
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export type InvoiceApiResult<T = ApiRecord> = {
  ok: boolean;
  status: number;
  body: ApiEnvelope<T>;
};

function buildInvoiceHistorySearchParams(query: InvoiceHistoryQuery = {}) {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.overdue) params.set("overdue", "true");
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  return params;
}

function buildFollowUpReminderSearchParams(query: InvoiceFollowUpReminderQuery = {}) {
  const params = new URLSearchParams();
  if (query.scope) params.set("scope", query.scope);
  if (query.limit) params.set("limit", String(query.limit));
  return params;
}

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? null;
}

export const invoiceApi = {
  getCapabilities<T = InvoiceCapabilitiesDto>() {
    return apiClient.get<ApiEnvelope<T>>("/api/invoice-capabilities");
  },

  getSummary<T = InvoiceSummaryDto>(query?: InvoiceHistoryQuery) {
    const params = buildInvoiceHistorySearchParams(query);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<ApiEnvelope<T>>(`/api/invoices-summary${suffix}`);
  },

  listInvoices<T = InvoiceRecord[]>(query?: InvoiceHistoryQuery) {
    const params = buildInvoiceHistorySearchParams(query);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<InvoiceHistoryEnvelope<T>>(`/api/invoices${suffix}`);
  },

  getFollowUpDashboard<T = InvoiceFollowUpDashboardDto>() {
    return apiClient.get<ApiEnvelope<T>>("/api/invoice-follow-ups");
  },

  getFollowUpReminders<T = InvoiceFollowUpReminderDashboardDto>(
    query?: InvoiceFollowUpReminderQuery,
  ) {
    const params = buildFollowUpReminderSearchParams(query);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<ApiEnvelope<T>>(`/api/invoice-follow-up-reminders${suffix}`);
  },

  listInvoiceFollowUps<T = InvoiceFollowUpDto[]>(invoiceId: string) {
    return apiClient.get<ApiEnvelope<T>>(`/api/invoices/${invoiceId}/follow-ups`);
  },

  getInvoice<T = InvoiceRecord>(id: string) {
    return apiClient.get<ApiEnvelope<T>>(`/api/invoices/${id}`);
  },

  exportInvoicesJson<T = InvoiceExportDto>(query?: InvoiceHistoryQuery) {
    const params = buildInvoiceHistorySearchParams(query);
    params.set("format", "json");
    return apiClient.get<ApiEnvelope<T>>(`/api/invoices/export?${params.toString()}`);
  },

  async downloadInvoicesCsv(query?: InvoiceHistoryQuery): Promise<InvoiceCsvDownload> {
    const params = buildInvoiceHistorySearchParams(query);
    params.set("format", "csv");
    const response = await apiFetch(`/api/invoices/export?${params.toString()}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const body = await readApiEnvelope<Record<string, unknown>>(response, "invoice export");
      throw new Error(body.message ?? "Failed to export invoice history");
    }

    const blob = await response.blob();
    const filename = getFilenameFromDisposition(response.headers.get("content-disposition")) ?? "invoice-history.csv";
    const rowCountHeader = response.headers.get("x-row-count");
    return {
      blob,
      filename,
      rowCount: rowCountHeader ? Number(rowCountHeader) : null,
      exportedAt: response.headers.get("x-exported-at"),
    };
  },

  async createInvoiceWithResult<T = InvoiceRecord>(
    payload: InvoicePayload,
  ): Promise<InvoiceApiResult<T>> {
    const response = await apiFetch("/api/invoices", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response, "invoice"),
    };
  },

  async updateInvoiceWithResult<T = InvoiceRecord>(
    id: string,
    payload: InvoicePayload,
  ): Promise<InvoiceApiResult<T>> {
    const response = await apiFetch(`/api/invoices/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response, "invoice"),
    };
  },

  async updateInvoiceStatusWithResult<T = InvoiceRecord>(
    id: string,
    status: InvoiceLifecycleStatus,
  ): Promise<InvoiceApiResult<T>> {
    const response = await apiFetch(`/api/invoices/${id}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response, "invoice status"),
    };
  },

  async createInvoiceFollowUpWithResult<T = InvoiceFollowUpDto>(
    invoiceId: string,
    payload: InvoiceFollowUpPayload,
  ): Promise<InvoiceApiResult<T>> {
    const response = await apiFetch(`/api/invoices/${invoiceId}/follow-ups`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response, "invoice follow-up"),
    };
  },

  async updateInvoiceFollowUpWithResult<T = InvoiceFollowUpDto>(
    followUpId: string,
    payload: InvoiceFollowUpPayload,
  ): Promise<InvoiceApiResult<T>> {
    const response = await apiFetch(`/api/invoice-follow-ups/${followUpId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response, "invoice follow-up"),
    };
  },

  async cancelInvoiceWithResult<T = InvoiceRecord>(
    id: string,
  ): Promise<InvoiceApiResult<T>> {
    const response = await apiFetch(`/api/invoices/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await readApiEnvelope<T>(response, "invoice"),
    };
  },
};
