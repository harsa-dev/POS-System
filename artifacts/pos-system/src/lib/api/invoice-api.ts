import { apiClient, apiFetch, type ApiEnvelope } from "@/lib/api/api-client";

type ApiRecord = Record<string, unknown>;

export type InvoiceBackendStatus = "DRAFT" | "SENT" | "PAID" | "CANCELLED";
export type InvoiceDiscountType = "PERCENTAGE" | "FIXED";

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
  restaurantId: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return isRecord(value) && typeof value.success === "boolean";
}

async function readApiEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const rawText = await response.text();

  if (!rawText.trim()) {
    return {
      success: false,
      message: `Empty invoice API response (${response.status})`,
    };
  }

  try {
    const parsed: unknown = JSON.parse(rawText);

    if (isApiEnvelope<T>(parsed)) {
      return parsed;
    }

    return {
      success: false,
      message: `Unexpected invoice API response (${response.status})`,
    };
  } catch {
    return {
      success: false,
      message: rawText,
    };
  }
}

export const invoiceApi = {
  listInvoices<T = InvoiceRecord[]>() {
    return apiClient.get<ApiEnvelope<T>>("/api/invoices");
  },

  getInvoice<T = InvoiceRecord>(id: string) {
    return apiClient.get<ApiEnvelope<T>>(`/api/invoices/${id}`);
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
      body: await readApiEnvelope<T>(response),
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
      body: await readApiEnvelope<T>(response),
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
      body: await readApiEnvelope<T>(response),
    };
  },
};
