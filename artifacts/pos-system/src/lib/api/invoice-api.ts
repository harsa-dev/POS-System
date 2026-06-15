import { apiClient, apiFetch, type ApiEnvelope } from "@/lib/api/api-client";
import { readApiEnvelope } from "@/lib/api/read-api-envelope";

type ApiRecord = Record<string, unknown>;

export type InvoiceBackendStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";
export type InvoiceDiscountType = "PERCENTAGE" | "FIXED";

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
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  return params;
}

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return null;
  const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
  return match?.[1] ?? null;
}

export const invoiceApi = {
  getCapabilities<T = InvoiceCapabilitiesDto>() {
    return apiClient.get<ApiEnvelope<T>>("/api/invoice-capabilities");
  },

  listInvoices<T = InvoiceRecord[]>(query?: InvoiceHistoryQuery) {
    const params = buildInvoiceHistorySearchParams(query);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<InvoiceHistoryEnvelope<T>>(`/api/invoices${suffix}`);
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
