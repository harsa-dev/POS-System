import { apiClient, type ApiEnvelope } from "@/lib/api/api-client";

import {
  buildServiceBusinessApiPath,
  SERVICE_BUSINESS_OPENAPI_OPERATIONS,
} from "./service-business-api-operations";
import type {
  AddServiceCostLineInput,
  ApproveServiceQuotationInput,
  CreateServiceInvoiceInput,
  CreateServiceQuotationInput,
  CreateServiceRequestInput,
  ListServiceBusinessJobsQuery,
  RecordServiceInvoicePaymentInput,
  ServiceBusinessMutationPreviewResponse,
  ServiceBusinessSummaryResponse,
  ServiceBusinessTransitionPreviewResponse,
  ServiceBusinessWorkflowResponse,
  ServiceBusinessWorkspaceResponse,
  UpdateServiceJobStatusInput,
} from "./service-business-api-contract-types";
import type { ServiceBusinessJob, ServiceBusinessWorkflowStatus } from "./service-business-workspace-types";

export { SERVICE_BUSINESS_OPENAPI_OPERATIONS };

export type ServiceBusinessEnvelope<TData> = ApiEnvelope<TData> & {
  data: TData;
};

async function unwrapData<TData>(request: Promise<ServiceBusinessEnvelope<TData>>) {
  const response = await request;
  return response.data;
}

export const serviceBusinessApi = {
  getWorkspace(): Promise<ServiceBusinessWorkspaceResponse> {
    return unwrapData(
      apiClient.get<ServiceBusinessEnvelope<ServiceBusinessWorkspaceResponse>>(
        buildServiceBusinessApiPath("serviceBusinessGetWorkspace"),
      ),
    );
  },

  getSummary(): Promise<ServiceBusinessSummaryResponse> {
    return unwrapData(
      apiClient.get<ServiceBusinessEnvelope<ServiceBusinessSummaryResponse>>(
        buildServiceBusinessApiPath("serviceBusinessGetSummary"),
      ),
    );
  },

  listJobs(query?: ListServiceBusinessJobsQuery): Promise<readonly ServiceBusinessJob[]> {
    return unwrapData(
      apiClient.get<ServiceBusinessEnvelope<readonly ServiceBusinessJob[]>>(
        buildServiceBusinessApiPath("serviceBusinessListJobs", { query }),
      ),
    );
  },

  getWorkflow(): Promise<ServiceBusinessWorkflowResponse> {
    return unwrapData(
      apiClient.get<ServiceBusinessEnvelope<ServiceBusinessWorkflowResponse>>(
        buildServiceBusinessApiPath("serviceBusinessGetWorkflowStatuses"),
      ),
    );
  },

  getTransitionPreview(
    jobId: string,
    nextStatus: ServiceBusinessWorkflowStatus,
  ): Promise<ServiceBusinessTransitionPreviewResponse> {
    return unwrapData(
      apiClient.get<ServiceBusinessEnvelope<ServiceBusinessTransitionPreviewResponse>>(
        buildServiceBusinessApiPath("serviceBusinessGetTransitionPreview", {
          pathParams: { id: jobId },
          query: { nextStatus },
        }),
      ),
    );
  },

  createRequest(
    input: CreateServiceRequestInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.post<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        buildServiceBusinessApiPath("serviceBusinessCreateRequest"),
        { json: input },
      ),
    );
  },

  updateJobStatus(
    input: UpdateServiceJobStatusInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.patch<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        buildServiceBusinessApiPath("serviceBusinessUpdateJobStatus", {
          pathParams: { id: input.jobId },
        }),
        { json: input },
      ),
    );
  },

  addCostLine(
    input: AddServiceCostLineInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.post<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        buildServiceBusinessApiPath("serviceBusinessAddCostLine", {
          pathParams: { id: input.jobId },
        }),
        { json: input },
      ),
    );
  },

  createQuotation(
    input: CreateServiceQuotationInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.post<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        buildServiceBusinessApiPath("serviceBusinessCreateQuotation"),
        { json: input },
      ),
    );
  },

  approveQuotation(
    input: ApproveServiceQuotationInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.patch<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        buildServiceBusinessApiPath("serviceBusinessApproveQuotation", {
          pathParams: { id: input.quotationId },
        }),
        { json: input },
      ),
    );
  },

  createInvoice(
    input: CreateServiceInvoiceInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.post<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        buildServiceBusinessApiPath("serviceBusinessCreateInvoice"),
        { json: input },
      ),
    );
  },

  recordInvoicePayment(
    input: RecordServiceInvoicePaymentInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return unwrapData(
      apiClient.patch<ServiceBusinessEnvelope<ServiceBusinessMutationPreviewResponse>>(
        buildServiceBusinessApiPath("serviceBusinessRecordInvoicePayment", {
          pathParams: { id: input.invoiceId },
        }),
        { json: input },
      ),
    );
  },
} as const;
