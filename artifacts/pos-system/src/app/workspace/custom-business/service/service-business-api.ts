function notImplemented(methodName: string): never {
  throw new Error(
    `${methodName} is not implemented yet. Service Business mode is still using mocked frontend data.`,
  );
}

export const serviceBusinessApi = {
  getWorkspace() {
    return notImplemented("serviceBusinessApi.getWorkspace");
  },
  listJobs() {
    return notImplemented("serviceBusinessApi.listJobs");
  },
  createRequest() {
    return notImplemented("serviceBusinessApi.createRequest");
  },
  updateJobStatus() {
    return notImplemented("serviceBusinessApi.updateJobStatus");
  },
  addCostLine() {
    return notImplemented("serviceBusinessApi.addCostLine");
  },
  createQuotation() {
    return notImplemented("serviceBusinessApi.createQuotation");
  },
  approveQuotation() {
    return notImplemented("serviceBusinessApi.approveQuotation");
  },
  createInvoice() {
    return notImplemented("serviceBusinessApi.createInvoice");
  },
  recordInvoicePayment() {
    return notImplemented("serviceBusinessApi.recordInvoicePayment");
  },
} as const;
