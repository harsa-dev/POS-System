import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

import type {
  AddServiceCostLineInput,
  ApproveServiceQuotationInput,
  CreateServiceInvoiceInput,
  CreateServiceQuotationInput,
  CreateServiceRequestInput,
  ListServiceBusinessJobsQuery,
  RecordServiceInvoicePaymentInput,
  ServiceBusinessMutationPreviewResponse,
  ServiceBusinessTransitionPreviewResponse,
  ServiceBusinessWorkflowResponse,
  UpdateServiceJobStatusInput,
} from "./service-business-api-contract-types";
import type { ServiceBusinessJob, ServiceBusinessWorkflowStatus } from "./service-business-workspace-types";

const SERVICE_BUSINESS_API_BASE = "/api/custom-business/service";

type ServiceBusinessEnvelope<TData> = ApiEnvelope<TData> & {
  data: TData;
};

function buildQueryString(query?: ListServiceBusinessJobsQuery) {
  if (!query) return "";

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

async function unwrapData<TData>(request: Promise<ServiceBusinessEnvelope<TData>>) {
  const response = await request;
  return response.data;
}

export const serviceBusinessApi = {
  getWorkspace(): Promise<ServiceBusinessWorkspaceResponse> {
    return unwrapData(
      apiClient.get<ServiceBusinessEnvelope<ServiceBusinessWorkspaceResponse>>(
        `${SERVICE_BUSINESS_API_BASE}/workspace`,
      ),
    );
  },

  listJobs(query?: ListServiceBusinessJobsQuery): Promise<readonly ServiceBusinessJob[]> {
    return unwrapData(
      apiClient.get<ServiceBusinessEnvelope<readonly ServiceBusinessJob[]>>(
        `${SERVICE_BUSINESS_API_BASE}/jobs${buildQueryString(query)}`,
      ),
    );
  },

  getWorkflow(): Promise<ServiceBusinessWorkflowResponse> {
    return unwrapData(
      apiClient.get<ServiceBusinessEnvelope<ServiceBusinessWorkflowResponse>>(
        `${SERVICE_BUSINESS_API_BASE}/workflow/statuses`,
      ),
    );
  },

  getTransitionPreview(
    jobId: string,
    nextStatus: ServiceBusinessWorkflowStatus,
  ): Promise<ServiceBusinessTransitionPreviewResponse> {
    const params = new URLSearchParams({ nextStatus });
    return unwrapData(
      apiClient.get<ServiceBusinessEnvelope<ServiceBusinessTransitionPreviewResponse>>(
        `${SERVICE_BUSINESS_API_BASE}/jobs/${jobId}/transition-preview?${params.toString()}`,
      ),
    );
  },

  createRequest(
    input: CreateServiceRequestInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.post<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        `${SERVICE_BUSINESS_API_BASE}/requests`,
        { json: input },
      ),
    );
  },

  updateJobStatus(
    input: UpdateServiceJobStatusInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.patch<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        `${SERVICE_BUSINESS_API_BASE}/jobs/${input.jobId}/guarded-status`,
        { json: input },
      ),
    );
  },

  addCostLine(
    input: AddServiceCostLineInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.post<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        `${SERVICE_BUSINESS_API_BASE}/jobs/${input.jobId}/cost-lines`,
        { json: input },
      ),
    );
  },

  createQuotation(
    input: CreateServiceQuotationInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.post<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        `${SERVICE_BUSINESS_API_BASE}/quotations`,
        { json: input },
      ),
    );
  },

  approveQuotation(
    input: ApproveServiceQuotationInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.patch<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        `${SERVICE_BUSINESS_API_BASE}/quotations/${input.quotationId}/approve`,
        { json: input },
      ),
    );
  },

  createInvoice(
    input: CreateServiceInvoiceInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.post<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        `${SERVICE_BUSINESS_API_BASE}/invoices`,
        { json: input },
      ),
    );
  },

  recordInvoicePayment(
    input: RecordServiceInvoicePaymentInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.patch<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        `${SERVICE_BUSINESS_API_BASE}/invoices/${input.invoiceId}/payment`,
        { json: input },
      ),
    );
  },
} as const;
