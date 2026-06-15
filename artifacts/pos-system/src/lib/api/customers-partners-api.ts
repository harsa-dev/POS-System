import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

export type CustomersPartnersBusinessMode = "restaurant" | "retail" | "custom-business" | "raw-material";

export type CustomersPartnersCapabilitiesDto = {
  businessId: string;
  businessMode: CustomersPartnersBusinessMode;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
  canSyncFromSales: boolean;
  isPlannedMode: boolean;
  plannedReason: string | null;
};

export type CustomerProfileDto = {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalSpending: number;
  transactions: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SupplierProfileDto = {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalPurchases: number;
  transactions: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyTierDto = {
  id: string;
  businessId: string;
  icon: string;
  tierName: "Bronze" | "Silver" | "Gold" | "Platinum";
  calculationPeriod: string;
  minimumSpending: number;
  automaticDiscount: string;
  sortOrder: number;
};

export type CustomersPartnersDashboardDto = {
  capabilities: CustomersPartnersCapabilitiesDto;
  summary: {
    totalCustomers: number;
    totalSuppliers: number;
    totalCustomerSpending: number;
    totalSupplierPurchases: number;
  };
  customers: CustomerProfileDto[];
  suppliers: SupplierProfileDto[];
  loyaltyTiers: LoyaltyTierDto[];
};

export type CreateContactPayload = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
};

export type UpdateContactPayload = CreateContactPayload;

export type CustomersPartnersExportKind = "customers" | "suppliers";

export type CustomersPartnersExportDto = {
  kind: CustomersPartnersExportKind;
  exportedAt: string;
  rowCount: number;
  rows: CustomerProfileDto[] | SupplierProfileDto[];
};

export type CustomersPartnersCsvDownload = {
  blob: Blob;
  filename: string;
  rowCount: number | null;
  exportedAt: string | null;
};

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

function buildQuery(params?: { search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function buildExportQuery(params: {
  kind: CustomersPartnersExportKind;
  search?: string;
  format?: "csv" | "json";
}) {
  const searchParams = new URLSearchParams();
  searchParams.set("kind", params.kind);
  if (params.search) searchParams.set("search", params.search);
  if (params.format) searchParams.set("format", params.format);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function getFilenameFromDisposition(disposition: string | null, fallback: string) {
  if (!disposition) return fallback;
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? fallback;
}

export const customersPartnersApi = {
  getCapabilities() {
    return apiClient.get<ApiDataEnvelope<CustomersPartnersCapabilitiesDto>>(
      "/api/customers-partners-capabilities",
    );
  },

  getDashboard(params?: { search?: string }) {
    return apiClient.get<ApiDataEnvelope<CustomersPartnersDashboardDto>>(
      `/api/customers-partners-dashboard${buildQuery(params)}`,
    );
  },

  createCustomer(payload: CreateContactPayload) {
    return apiClient.post<ApiDataEnvelope<CustomerProfileDto>>(
      "/api/customers-partners/customers",
      { json: payload },
    );
  },

  createSupplier(payload: CreateContactPayload) {
    return apiClient.post<ApiDataEnvelope<SupplierProfileDto>>(
      "/api/customers-partners/suppliers",
      { json: payload },
    );
  },

  updateCustomer(id: string, payload: UpdateContactPayload) {
    return apiClient.patch<ApiDataEnvelope<CustomerProfileDto>>(
      `/api/customers-partners/customers/${encodeURIComponent(id)}`,
      { json: payload },
    );
  },

  updateSupplier(id: string, payload: UpdateContactPayload) {
    return apiClient.patch<ApiDataEnvelope<SupplierProfileDto>>(
      `/api/customers-partners/suppliers/${encodeURIComponent(id)}`,
      { json: payload },
    );
  },

  deleteCustomer(id: string) {
    return apiClient.delete<ApiDataEnvelope<{ id: string }>>(
      `/api/customers-partners/customers/${encodeURIComponent(id)}`,
    );
  },

  deleteSupplier(id: string) {
    return apiClient.delete<ApiDataEnvelope<{ id: string }>>(
      `/api/customers-partners/suppliers/${encodeURIComponent(id)}`,
    );
  },

  exportContactsJson(params: { kind: CustomersPartnersExportKind; search?: string }) {
    return apiClient.get<ApiDataEnvelope<CustomersPartnersExportDto>>(
      `/api/customers-partners/export${buildExportQuery({ ...params, format: "json" })}`,
    );
  },

  async downloadContactsCsv(params: { kind: CustomersPartnersExportKind; search?: string }): Promise<CustomersPartnersCsvDownload> {
    const response = await fetch(
      `/api/customers-partners/export${buildExportQuery({ ...params, format: "csv" })}`,
      {
        credentials: "include",
        headers: { Accept: "text/csv" },
      },
    );

    if (!response.ok) {
      let message = `Failed to export ${params.kind}.`;
      try {
        const errorBody = await response.json();
        if (typeof errorBody?.message === "string") message = errorBody.message;
      } catch {
        // Keep fallback message for non-JSON failures.
      }
      throw new Error(message);
    }

    const blob = await response.blob();
    const fallback = `${params.kind}-${new Date().toISOString().slice(0, 10)}.csv`;

    return {
      blob,
      filename: getFilenameFromDisposition(response.headers.get("Content-Disposition"), fallback),
      rowCount: Number(response.headers.get("X-Row-Count")) || null,
      exportedAt: response.headers.get("X-Exported-At"),
    };
  },
};
