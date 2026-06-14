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

type ApiDataEnvelope<T> = ApiEnvelope<T> & { data: T };

function buildQuery(params?: { search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  const query = searchParams.toString();
  return query ? `?${query}` : "";
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
};
