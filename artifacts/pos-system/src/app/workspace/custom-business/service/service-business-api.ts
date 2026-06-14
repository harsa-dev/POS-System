import {
  SERVICE_BUSINESS_OPENAPI_OPERATIONS,
  serviceBusinessGeneratedApiData,
  type ServiceBusinessGeneratedEnvelope,
} from "./service-business.generated-api-client";
import type {
  AddServiceCostLineInput,
  ApproveServiceQuotationInput,
  CancelServiceInvoiceInput,
  CancelServiceQuotationInput,
  CreateServiceInvoiceInput,
  CreateServiceQuotationInput,
  CreateServiceRequestInput,
  ListServiceBusinessJobsQuery,
  RecordServiceInvoicePaymentInput,
  ReverseServiceInvoicePaymentInput,
  ServiceBusinessInvoicePaymentPreviewEstimates,
  ServiceBusinessInvoicePreviewEstimates,
  ServiceBusinessMutationPreviewResponse,
  ServiceBusinessPreviewResponse,
  ServiceBusinessQuotationPreviewEstimates,
  ServiceBusinessSummaryResponse,
  ServiceBusinessTransitionPreviewResponse,
  ServiceBusinessWorkflowResponse,
  ServiceBusinessWorkspaceResponse,
  UpdateServiceJobStatusInput,
  UpdateServiceRequestStatusInput,
} from "./service-business-api-contract-types";
import type { ServiceBusinessJob, ServiceBusinessWorkflowStatus } from "./service-business-workspace-types";

export { SERVICE_BUSINESS_OPENAPI_OPERATIONS };

export type ServiceBusinessEnvelope<TData> = ServiceBusinessGeneratedEnvelope<TData>;

export const serviceBusinessApi = {
  getWorkspace(): Promise<ServiceBusinessWorkspaceResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessWorkspaceResponse>(
      "serviceBusinessGetWorkspace",
    );
  },

  getSummary(): Promise<ServiceBusinessSummaryResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessSummaryResponse>(
      "serviceBusinessGetSummary",
    );
  },

  listJobs(query?: ListServiceBusinessJobsQuery): Promise<readonly ServiceBusinessJob[]> {
    return serviceBusinessGeneratedApiData<readonly ServiceBusinessJob[]>(
      "serviceBusinessListJobs",
      { query },
    );
  },

  getWorkflow(): Promise<ServiceBusinessWorkflowResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessWorkflowResponse>(
      "serviceBusinessGetWorkflowStatuses",
    );
  },

  getTransitionPreview(
    jobId: string,
    nextStatus: ServiceBusinessWorkflowStatus,
  ): Promise<ServiceBusinessTransitionPreviewResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessTransitionPreviewResponse>(
      "serviceBusinessGetTransitionPreview",
      {
        pathParams: { id: jobId },
        query: { nextStatus },
      },
    );
  },

  previewQuotation(
    input: CreateServiceQuotationInput,
  ): Promise<ServiceBusinessPreviewResponse<ServiceBusinessQuotationPreviewEstimates>> {
    return serviceBusinessGeneratedApiData<
      ServiceBusinessPreviewResponse<ServiceBusinessQuotationPreviewEstimates>
    >("serviceBusinessPreviewQuotation", { json: input });
  },

  previewInvoice(
    input: CreateServiceInvoiceInput,
  ): Promise<ServiceBusinessPreviewResponse<ServiceBusinessInvoicePreviewEstimates>> {
    return serviceBusinessGeneratedApiData<
      ServiceBusinessPreviewResponse<ServiceBusinessInvoicePreviewEstimates>
    >("serviceBusinessPreviewInvoice", { json: input });
  },

  previewInvoicePayment(
    input: RecordServiceInvoicePaymentInput,
  ): Promise<ServiceBusinessPreviewResponse<ServiceBusinessInvoicePaymentPreviewEstimates>> {
    return serviceBusinessGeneratedApiData<
      ServiceBusinessPreviewResponse<ServiceBusinessInvoicePaymentPreviewEstimates>
    >("serviceBusinessPreviewInvoicePayment", { json: input });
  },

  createRequest(
    input: CreateServiceRequestInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessMutationPreviewResponse>(
      "serviceBusinessCreateRequest",
      { json: input },
    );
  },

  updateJobStatus(
    input: UpdateServiceJobStatusInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessMutationPreviewResponse>(
      "serviceBusinessSetJobStatus",
      {
        pathParams: { id: input.jobId },
        json: {
          status: input.nextStatus,
          note: input.note,
        },
      },
    );
  },

  updateRequestStatus(
    input: UpdateServiceRequestStatusInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessMutationPreviewResponse>(
      "serviceBusinessSetRequestStatus",
      {
        pathParams: { id: input.requestId },
        json: {
          status: input.nextStatus,
          note: input.note,
        },
      },
    );
  },

  addCostLine(
    input: AddServiceCostLineInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessMutationPreviewResponse>(
      "serviceBusinessAddCostLine",
      {
        pathParams: { id: input.jobId },
        json: input,
      },
    );
  },

  createQuotation(
    input: CreateServiceQuotationInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessMutationPreviewResponse>(
      "serviceBusinessCreateQuotation",
      { json: input },
    );
  },

  approveQuotation(
    input: ApproveServiceQuotationInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessMutationPreviewResponse>(
      "serviceBusinessApproveQuotation",
      {
        pathParams: { id: input.quotationId },
        json: input,
      },
    );
  },

  cancelQuotation(
    input: CancelServiceQuotationInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessMutationPreviewResponse>(
      "serviceBusinessCancelQuotation",
      {
        pathParams: { id: input.quotationId },
        json: { note: input.note },
      },
    );
  },

  createInvoice(
    input: CreateServiceInvoiceInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessMutationPreviewResponse>(
      "serviceBusinessCreateInvoice",
      { json: input },
    );
  },

  recordInvoicePayment(
    input: RecordServiceInvoicePaymentInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessMutationPreviewResponse>(
      "serviceBusinessRecordInvoicePayment",
      {
        pathParams: { id: input.invoiceId },
        json: input,
      },
    );
  },

  reverseInvoicePayment(
    input: ReverseServiceInvoicePaymentInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessMutationPreviewResponse>(
      "serviceBusinessReverseInvoicePayment",
      {
        pathParams: { id: input.invoiceId },
        json: {
          amount: input.amount,
          note: input.note,
        },
      },
    );
  },

  cancelInvoice(
    input: CancelServiceInvoiceInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return serviceBusinessGeneratedApiData<ServiceBusinessMutationPreviewResponse>(
      "serviceBusinessCancelInvoice",
      {
        pathParams: { id: input.invoiceId },
        json: { note: input.note },
      },
    );
  },
} as const;
