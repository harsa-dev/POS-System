import {
  RAW_MATERIAL_PERMISSIONS,
  getRawMaterialPermissionRoles,
  type RawMaterialPermission,
} from "./raw-material.permissions.js";
import {
  RAW_MATERIAL_AUDIT_ENTITY_TYPES,
  RAW_MATERIAL_AUDIT_OPERATIONS,
  type RawMaterialAuditEntityType,
  type RawMaterialAuditOperation,
} from "./raw-material.audit.js";

export type RawMaterialPolicyMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type RawMaterialPolicyAuditRequirement =
  | { required: false; reason: string }
  | {
      required: true;
      entityType: RawMaterialAuditEntityType;
      operation: RawMaterialAuditOperation;
    };

export type RawMaterialPolicyEntry = {
  id: string;
  method: RawMaterialPolicyMethod;
  path: string;
  permission: RawMaterialPermission;
  audit: RawMaterialPolicyAuditRequirement;
  note: string;
};

const NO_AUDIT_READ_ONLY = {
  required: false,
  reason: "read-only endpoint",
} as const satisfies RawMaterialPolicyAuditRequirement;

const NO_AUDIT_PREVIEW_ONLY = {
  required: false,
  reason: "read-only preview endpoint",
} as const satisfies RawMaterialPolicyAuditRequirement;

export const RAW_MATERIAL_POLICY_MATRIX = [
  {
    id: "summary.read",
    method: "GET",
    path: "/raw-material/summary",
    permission: RAW_MATERIAL_PERMISSIONS.view,
    audit: NO_AUDIT_READ_ONLY,
    note: "Shared dashboard summary read.",
  },
  {
    id: "suppliers.list",
    method: "GET",
    path: "/raw-material/suppliers",
    permission: RAW_MATERIAL_PERMISSIONS.view,
    audit: NO_AUDIT_READ_ONLY,
    note: "Supplier list read.",
  },
  {
    id: "suppliers.create",
    method: "POST",
    path: "/raw-material/suppliers",
    permission: RAW_MATERIAL_PERMISSIONS.supplierManage,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.supplier,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.create,
    },
    note: "Supplier creation requires supplier manager permission and audit.",
  },
  {
    id: "suppliers.update",
    method: "PATCH",
    path: "/raw-material/suppliers/:id",
    permission: RAW_MATERIAL_PERMISSIONS.supplierManage,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.supplier,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.update,
    },
    note: "Supplier updates and deactivation are audited.",
  },
  {
    id: "storage.list",
    method: "GET",
    path: "/raw-material/storage-locations",
    permission: RAW_MATERIAL_PERMISSIONS.view,
    audit: NO_AUDIT_READ_ONLY,
    note: "Storage location list read.",
  },
  {
    id: "storage.create",
    method: "POST",
    path: "/raw-material/storage-locations",
    permission: RAW_MATERIAL_PERMISSIONS.storageManage,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.storageLocation,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.create,
    },
    note: "Storage creation requires storage manager permission and audit.",
  },
  {
    id: "storage.update",
    method: "PATCH",
    path: "/raw-material/storage-locations/:id",
    permission: RAW_MATERIAL_PERMISSIONS.storageManage,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.storageLocation,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.update,
    },
    note: "Storage update and deactivation are audited.",
  },
  {
    id: "intakes.list",
    method: "GET",
    path: "/raw-material/intakes",
    permission: RAW_MATERIAL_PERMISSIONS.view,
    audit: NO_AUDIT_READ_ONLY,
    note: "Intake list read.",
  },
  {
    id: "intakes.create",
    method: "POST",
    path: "/raw-material/intakes",
    permission: RAW_MATERIAL_PERMISSIONS.intakeCreate,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.intake,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.create,
    },
    note: "Intake creation requires intake create permission and audit.",
  },
  {
    id: "intakes.update",
    method: "PATCH",
    path: "/raw-material/intakes/:id",
    permission: RAW_MATERIAL_PERMISSIONS.intakeUpdate,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.intake,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.update,
    },
    note: "Intake mutation is guarded by workflow status and audited.",
  },
  {
    id: "intakes.cancel",
    method: "POST",
    path: "/raw-material/status/intakes/:id",
    permission: RAW_MATERIAL_PERMISSIONS.intakeUpdate,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.intake,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.cancel,
    },
    note: "Status facade only supports intake cancellation for now.",
  },
  {
    id: "weighings.list",
    method: "GET",
    path: "/raw-material/weighings",
    permission: RAW_MATERIAL_PERMISSIONS.view,
    audit: NO_AUDIT_READ_ONLY,
    note: "Weighing list read.",
  },
  {
    id: "weighings.create",
    method: "POST",
    path: "/raw-material/weighings",
    permission: RAW_MATERIAL_PERMISSIONS.weighingRecord,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.weighing,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.create,
    },
    note: "Weighing record creation requires operator permission and audit.",
  },
  {
    id: "weighings.update",
    method: "PATCH",
    path: "/raw-material/weighings/:id",
    permission: RAW_MATERIAL_PERMISSIONS.weighingRecord,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.weighing,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.update,
    },
    note: "Weighing mutation is audited.",
  },
  {
    id: "batches.list",
    method: "GET",
    path: "/raw-material/batches",
    permission: RAW_MATERIAL_PERMISSIONS.view,
    audit: NO_AUDIT_READ_ONLY,
    note: "Batch list read.",
  },
  {
    id: "batches.create",
    method: "POST",
    path: "/raw-material/batches",
    permission: RAW_MATERIAL_PERMISSIONS.batchManage,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.batch,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.create,
    },
    note: "Batch creation requires stock-capable roles and audit.",
  },
  {
    id: "batches.status",
    method: "POST",
    path: "/raw-material/status/batches/:id",
    permission: RAW_MATERIAL_PERMISSIONS.batchManage,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.batch,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.updateStatus,
    },
    note: "Batch quality and quarantine status changes are audited.",
  },
  {
    id: "processing-runs.list",
    method: "GET",
    path: "/raw-material/processing-runs",
    permission: RAW_MATERIAL_PERMISSIONS.view,
    audit: NO_AUDIT_READ_ONLY,
    note: "Processing run list read.",
  },
  {
    id: "processing-runs.create",
    method: "POST",
    path: "/raw-material/processing-runs",
    permission: RAW_MATERIAL_PERMISSIONS.processingManage,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.processingRun,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.create,
    },
    note: "Processing run creation requires stock-capable roles and audit.",
  },
  {
    id: "processing-runs.status",
    method: "POST",
    path: "/raw-material/status/processing-runs/:id",
    permission: RAW_MATERIAL_PERMISSIONS.processingManage,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.processingRun,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.updateStatus,
    },
    note: "Processing status changes and cancellation reversal are audited.",
  },
  {
    id: "pens.list",
    method: "GET",
    path: "/raw-material/pens",
    permission: RAW_MATERIAL_PERMISSIONS.view,
    audit: NO_AUDIT_READ_ONLY,
    note: "Kandang pen list read.",
  },
  {
    id: "pens.create",
    method: "POST",
    path: "/raw-material/pens",
    permission: RAW_MATERIAL_PERMISSIONS.kandangManage,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.kandangPen,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.create,
    },
    note: "Kandang pen creation requires operator permission and audit.",
  },
  {
    id: "pens.status",
    method: "POST",
    path: "/raw-material/status/pens/:id",
    permission: RAW_MATERIAL_PERMISSIONS.kandangManage,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.kandangPen,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.updateStatus,
    },
    note: "Pen health/status updates are audited.",
  },
  {
    id: "stock-movements.list",
    method: "GET",
    path: "/raw-material/stock-movements",
    permission: RAW_MATERIAL_PERMISSIONS.view,
    audit: NO_AUDIT_READ_ONLY,
    note: "Stock movement ledger read.",
  },
  {
    id: "stock-movements.adjust",
    method: "POST",
    path: "/raw-material/stock-movements/adjust",
    permission: RAW_MATERIAL_PERMISSIONS.stockAdjust,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.stockMovement,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.adjustStock,
    },
    note: "Manual adjustment is approval-only and audited.",
  },
  {
    id: "stock-movements.reverse-adjustment",
    method: "POST",
    path: "/raw-material/stock-movements/:id/reverse-adjustment",
    permission: RAW_MATERIAL_PERMISSIONS.stockAdjust,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.stockMovement,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.reverseAdjustment,
    },
    note: "Adjustment reversal is approval-only, idempotent, and audited.",
  },
  {
    id: "stock-movements.transfer",
    method: "POST",
    path: "/raw-material/stock-movements/transfer",
    permission: RAW_MATERIAL_PERMISSIONS.stockTransfer,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.stockMovement,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.transferStock,
    },
    note: "Transfer requires stock-capable roles and audit.",
  },
  {
    id: "stock-movements.consume-processing",
    method: "POST",
    path: "/raw-material/stock-movements/consume-processing",
    permission: RAW_MATERIAL_PERMISSIONS.stockConsume,
    audit: {
      required: true,
      entityType: RAW_MATERIAL_AUDIT_ENTITY_TYPES.stockMovement,
      operation: RAW_MATERIAL_AUDIT_OPERATIONS.consumeProcessing,
    },
    note: "Processing consumption requires stock-capable roles and audit.",
  },
  {
    id: "previews.intake",
    method: "POST",
    path: "/raw-material/previews/intake",
    permission: RAW_MATERIAL_PERMISSIONS.view,
    audit: NO_AUDIT_PREVIEW_ONLY,
    note: "Preview endpoint is read-only and must not mutate data.",
  },
  {
    id: "previews.batch",
    method: "POST",
    path: "/raw-material/previews/batch",
    permission: RAW_MATERIAL_PERMISSIONS.view,
    audit: NO_AUDIT_PREVIEW_ONLY,
    note: "Preview endpoint is read-only and must not mutate data.",
  },
  {
    id: "previews.processing-run",
    method: "POST",
    path: "/raw-material/previews/processing-run",
    permission: RAW_MATERIAL_PERMISSIONS.view,
    audit: NO_AUDIT_PREVIEW_ONLY,
    note: "Preview endpoint is read-only and must not mutate data.",
  },
] as const satisfies readonly RawMaterialPolicyEntry[];

export const RAW_MATERIAL_SENSITIVE_POLICY_ENTRY_IDS = RAW_MATERIAL_POLICY_MATRIX
  .filter((entry) => entry.audit.required)
  .map((entry) => entry.id);

export function getRawMaterialPolicyEntriesByPermission(permission: RawMaterialPermission) {
  return RAW_MATERIAL_POLICY_MATRIX.filter((entry) => entry.permission === permission);
}

export function getRawMaterialPolicySnapshot() {
  return RAW_MATERIAL_POLICY_MATRIX.map((entry) => ({
    ...entry,
    roles: getRawMaterialPermissionRoles(entry.permission),
  }));
}

export function assertRawMaterialPolicyCoverage() {
  const permissions = new Set<RawMaterialPermission>(Object.values(RAW_MATERIAL_PERMISSIONS));
  const coveredPermissions = new Set<RawMaterialPermission>(
    RAW_MATERIAL_POLICY_MATRIX.map((entry) => entry.permission),
  );
  const missingPermissions = [...permissions].filter((permission) => !coveredPermissions.has(permission));

  if (missingPermissions.length > 0) {
    throw new Error(`Missing Raw Material policy coverage for permissions: ${missingPermissions.join(", ")}`);
  }

  for (const entry of RAW_MATERIAL_POLICY_MATRIX) {
    const roles = getRawMaterialPermissionRoles(entry.permission);

    if (roles.length === 0) {
      throw new Error(`Raw Material policy entry ${entry.id} has no roles for ${entry.permission}`);
    }
  }
}
