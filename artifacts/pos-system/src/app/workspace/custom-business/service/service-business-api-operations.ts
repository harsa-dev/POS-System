export const SERVICE_BUSINESS_OPENAPI_OPERATIONS = {
  serviceBusinessGetWorkspace: {
    method: "GET",
    path: "/custom-business/service/workspace",
  },
  serviceBusinessGetSummary: {
    method: "GET",
    path: "/custom-business/service/summary",
  },
  serviceBusinessListJobs: {
    method: "GET",
    path: "/custom-business/service/jobs",
  },
  serviceBusinessGetWorkflowStatuses: {
    method: "GET",
    path: "/custom-business/service/workflow/statuses",
  },
  serviceBusinessGetTransitionPreview: {
    method: "GET",
    path: "/custom-business/service/jobs/{id}/transition-preview",
  },
  serviceBusinessCreateRequest: {
    method: "POST",
    path: "/custom-business/service/requests",
  },
  serviceBusinessUpdateJobStatus: {
    method: "PATCH",
    path: "/custom-business/service/jobs/{id}/guarded-status",
  },
  serviceBusinessAddCostLine: {
    method: "POST",
    path: "/custom-business/service/jobs/{id}/cost-lines",
  },
  serviceBusinessCreateQuotation: {
    method: "POST",
    path: "/custom-business/service/quotations",
  },
  serviceBusinessApproveQuotation: {
    method: "PATCH",
    path: "/custom-business/service/quotations/{id}/approve",
  },
  serviceBusinessCreateInvoice: {
    method: "POST",
    path: "/custom-business/service/invoices",
  },
  serviceBusinessRecordInvoicePayment: {
    method: "PATCH",
    path: "/custom-business/service/invoices/{id}/payment",
  },
} as const;

export type ServiceBusinessOpenApiOperationId = keyof typeof SERVICE_BUSINESS_OPENAPI_OPERATIONS;

type ServiceBusinessPathParams = Record<string, string | number | boolean | null | undefined>;
type ServiceBusinessQueryParams = Record<string, string | number | boolean | null | undefined>;

function interpolatePath(path: string, params?: ServiceBusinessPathParams) {
  if (!params) return path;

  return Object.entries(params).reduce((nextPath, [key, value]) => {
    if (value === undefined || value === null) return nextPath;
    return nextPath.replace(`{${key}}`, encodeURIComponent(String(value)));
  }, path);
}

function buildQueryString(query?: ServiceBusinessQueryParams) {
  if (!query) return "";

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export function getServiceBusinessOpenApiOperation(operationId: ServiceBusinessOpenApiOperationId) {
  return SERVICE_BUSINESS_OPENAPI_OPERATIONS[operationId];
}

export function buildServiceBusinessApiPath(
  operationId: ServiceBusinessOpenApiOperationId,
  options?: {
    pathParams?: ServiceBusinessPathParams;
    query?: ServiceBusinessQueryParams;
  },
) {
  const operation = getServiceBusinessOpenApiOperation(operationId);
  const path = interpolatePath(operation.path, options?.pathParams);
  return `/api${path}${buildQueryString(options?.query)}`;
}
