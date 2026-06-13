import type {
  AddServiceCostLineInput,
  ApproveServiceQuotationInput,
  CreateServiceInvoiceInput,
  CreateServiceQuotationInput,
  CreateServiceRequestInput,
  ListServiceBusinessJobsQuery,
  RecordServiceInvoicePaymentInput,
  ServiceBusinessMutationPreviewResponse,
  ServiceBusinessWorkspaceResponse,
  UpdateServiceJobStatusInput,
} from "./service-business-api-contract-types";
import type { ServiceBusinessJob } from "./service-business-workspace-types";

function notImplemented(methodName: string): never {
  throw new Error(
    `${methodName} is not implemented yet. Service Business mode is still using mocked frontend data.`,
  );
}

export const serviceBusinessApi = {
  getWorkspace(): Promise<ServiceBusinessWorkspaceResponse> {
    return notImplemented("serviceBusinessApi.getWorkspace");
  },
  listJobs(_query?: ListServiceBusinessJobsQuery): Promise<readonly ServiceBusinessJob[]> {
    return notImplemented("serviceBusinessApi.listJobs");
  },
  createRequest(
    _input: CreateServiceRequestInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return notImplemented("serviceBusinessApi.createRequest");
  },
  updateJobStatus(
    _input: UpdateServiceJobStatusInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return notImplemented("serviceBusinessApi.updateJobStatus");
  },
  addCostLine(
    _input: AddServiceCostLineInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return notImplemented("serviceBusinessApi.addCostLine");
  },
  createQuotation(
    _input: CreateServiceQuotationInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return notImplemented("serviceBusinessApi.createQuotation");
  },
  approveQuotation(
    _input: ApproveServiceQuotationInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return notImplemented("serviceBusinessApi.approveQuotation");
  },
  createInvoice(
    _input: CreateServiceInvoiceInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return notImplemented("serviceBusinessApi.createInvoice");
  },
  recordInvoicePayment(
    _input: RecordServiceInvoicePaymentInput,
  ): Promise<ServiceBusinessMutationPreviewResponse> {
    return notImplemented("serviceBusinessApi.recordInvoicePayment");
  },
} as const;
