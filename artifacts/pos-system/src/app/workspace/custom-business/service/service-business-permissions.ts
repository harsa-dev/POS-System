export const serviceBusinessPermissions = {
  workspaceView: "custom-business.service.view",
  workspaceManage: "custom-business.service.manage",
  requestCreate: "custom-business.service.request.create",
  requestUpdate: "custom-business.service.request.update",
  jobAssign: "custom-business.service.job.assign",
  jobStatusUpdate: "custom-business.service.job.status.update",
  quoteCreate: "custom-business.service.quote.create",
  quoteApprove: "custom-business.service.quote.approve",
  invoiceCreate: "custom-business.service.invoice.create",
  invoicePaymentRecord: "custom-business.service.invoice.payment.record",
  configManage: "custom-business.service.config.manage",
} as const;

export type ServiceBusinessPermissionKey = keyof typeof serviceBusinessPermissions;
export type ServiceBusinessPermission =
  (typeof serviceBusinessPermissions)[ServiceBusinessPermissionKey];

export const serviceBusinessPermissionGroups = [
  {
    label: "Workspace",
    permissions: [
      serviceBusinessPermissions.workspaceView,
      serviceBusinessPermissions.workspaceManage,
    ],
  },
  {
    label: "Request & job",
    permissions: [
      serviceBusinessPermissions.requestCreate,
      serviceBusinessPermissions.requestUpdate,
      serviceBusinessPermissions.jobAssign,
      serviceBusinessPermissions.jobStatusUpdate,
    ],
  },
  {
    label: "Quote & invoice",
    permissions: [
      serviceBusinessPermissions.quoteCreate,
      serviceBusinessPermissions.quoteApprove,
      serviceBusinessPermissions.invoiceCreate,
      serviceBusinessPermissions.invoicePaymentRecord,
    ],
  },
  {
    label: "Configuration",
    permissions: [serviceBusinessPermissions.configManage],
  },
] as const;
