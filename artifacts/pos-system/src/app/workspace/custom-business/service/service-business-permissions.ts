export const serviceBusinessPermissions = {
  workspaceView: "service.dashboard.view",
  workspaceManage: "service.workflow.update",
  requestCreate: "service.jobs.create",
  requestUpdate: "service.jobs.update",
  jobAssign: "service.jobs.assign",
  jobStatusUpdate: "service.jobs.update",
  quoteCreate: "service.quotes.create",
  quoteApprove: "service.quotes.approve",
  invoiceCreate: "service.invoices.create",
  invoicePaymentRecord: "service.invoices.record-payment",
  configManage: "service.policy.view",
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
