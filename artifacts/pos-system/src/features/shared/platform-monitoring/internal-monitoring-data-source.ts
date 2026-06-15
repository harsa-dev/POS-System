import { internalMonitoringApi } from "@/lib/api/internal-monitoring-api";
import type {
  InternalMonitoringApiImplementationStepDto,
  InternalMonitoringControlRoomDto,
  InternalMonitoringDataIntegrityCheckDto,
  InternalMonitoringMutationReadinessContractDto,
  InternalMonitoringRouteInventoryItemDto,
  InternalMonitoringSource,
} from "@/lib/api/internal-monitoring.dto";

import {
  apiImplementationSteps,
  controlRoomCards,
  controlRoomSignals,
  devActionItems,
  getControlRoomSummary,
  schemaDecisionRecords,
} from "./internal-monitoring-control-room.mock";

export type InternalMonitoringDataSourceResult = InternalMonitoringControlRoomDto & {
  source: InternalMonitoringSource;
  fallbackReason: string | null;
  routeInventory: InternalMonitoringRouteInventoryItemDto[];
  contractReadiness: InternalMonitoringApiImplementationStepDto[];
  dataIntegrityChecks: InternalMonitoringDataIntegrityCheckDto[];
  mutationReadinessContracts: InternalMonitoringMutationReadinessContractDto[];
  sectionFallbacks: string[];
};

const mockRouteInventory: InternalMonitoringRouteInventoryItemDto[] = [
  {
    id: "internal-monitoring",
    route: "/dashboard/internal-monitoring",
    owner: "Platform Admin",
    guard: "platform-admin",
    status: "active",
    notes: "Frontend route is mounted behind platform-admin.internal-monitoring.read.",
  },
  {
    id: "admin-role-console",
    route: "/dashboard/internal/admin-role-console",
    owner: "Platform Admin",
    guard: "auth",
    status: "active",
    notes: "Mock console. Must not get mutation endpoints before RBAC/audit guard.",
  },
  {
    id: "approval-control-console",
    route: "/dashboard/internal/approval-control-console",
    owner: "Platform Admin",
    guard: "auth",
    status: "active",
    notes: "Approval decisions are mock-only and blocked from backend mutation.",
  },
];

const mockDataIntegrityChecks: InternalMonitoringDataIntegrityCheckDto[] = [
  {
    id: "read-only-phase",
    check: "Internal monitoring is read-only",
    status: "pass",
    severity: "info",
    detail: "Only GET endpoints are scaffolded under /api/internal.",
  },
  {
    id: "no-prisma-promotion",
    check: "No Prisma schema promotion",
    status: "pass",
    severity: "info",
    detail: "Internal monitoring repository is mock-backed and does not add persistence models.",
  },
  {
    id: "mutation-blocker",
    check: "No internal mutation wiring",
    status: "pass",
    severity: "critical",
    detail: "platform-admin:check blocks POST/PATCH/DELETE internal route wiring.",
  },
];

const mockMutationReadinessContracts: InternalMonitoringMutationReadinessContractDto[] = [
  {
    id: "alert-acknowledge-dry-run",
    action: "Acknowledge internal alert",
    targetSurface: "Internal Monitoring Alerts",
    proposedEndpoint: "PATCH /api/internal/alerts/:alertId/acknowledge",
    proposedMethod: "PATCH",
    status: "Dry-run Only",
    dryRunMode: "Required",
    requiredCapability: "platform-admin.internal-monitoring.alerts.acknowledge",
    requiredAuditEvent: "platform_admin.internal_alert.acknowledge_requested",
    requiredApproval: "Not required for dry-run. Required for real acknowledgement if alert severity is critical.",
    rollbackPlan: "Store previous acknowledgement state and note before any future write path is enabled.",
    rateLimit: "10 requests per minute per platform admin user after mutation is implemented.",
    blockedReason: "Real acknowledgement remains blocked until audit write and approval policy are implemented.",
    requiredProof: [
      "Audit event registry entry exists.",
      "Approval policy for critical alerts exists.",
      "Dry-run response validates target alert and user capability without mutating data.",
    ],
  },
  {
    id: "route-snapshot-refresh-dry-run",
    action: "Refresh route inventory snapshot",
    targetSurface: "Route Inventory",
    proposedEndpoint: "POST /api/internal/routes/inventory/refresh",
    proposedMethod: "POST",
    status: "Blocked",
    dryRunMode: "Required",
    requiredCapability: "platform-admin.internal-monitoring.routes.refresh",
    requiredAuditEvent: "platform_admin.route_inventory.refresh_requested",
    requiredApproval: "Required before replacing any persisted route snapshot.",
    rollbackPlan: "Keep previous snapshot version and diff summary for rollback before promotion.",
    rateLimit: "2 requests per minute per platform admin user after mutation is implemented.",
    blockedReason: "No persisted route snapshot exists yet, so refresh mutation has no safe target.",
    requiredProof: [
      "Route snapshot persistence model is approved.",
      "Snapshot diff format is documented.",
      "Rollback path can restore previous snapshot version.",
    ],
  },
  {
    id: "schema-candidate-promote-dry-run",
    action: "Promote internal schema candidate",
    targetSurface: "Schema Risk",
    proposedEndpoint: "POST /api/internal/schema-candidates/:candidateId/promote",
    proposedMethod: "POST",
    status: "Blocked",
    dryRunMode: "Required",
    requiredCapability: "platform-admin.internal-monitoring.schema.promote",
    requiredAuditEvent: "platform_admin.schema_candidate.promote_requested",
    requiredApproval: "Required from OWNER plus technical reviewer before any migration is generated.",
    rollbackPlan: "Migration must include down-plan notes, seed rollback notes, and data retention policy.",
    rateLimit: "1 request per hour per platform admin user after mutation is implemented.",
    blockedReason: "Schema promotion is explicitly blocked until persistence proof exists.",
    requiredProof: [
      "Historical retention requirement exists.",
      "Migration plan has been reviewed.",
      "Dry-run can produce migration impact summary without writing schema files.",
    ],
  },
];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Internal monitoring API section is unavailable.";
}

export function getInternalMonitoringMockControlRoomData(
  source: InternalMonitoringSource = "mock",
  fallbackReason: string | null = null,
  sectionFallbacks: string[] = [],
): InternalMonitoringDataSourceResult {
  return {
    source,
    generatedAt: new Date().toISOString(),
    summary: getControlRoomSummary(),
    cards: controlRoomCards,
    signals: controlRoomSignals,
    apiImplementationSteps,
    schemaDecisionRecords,
    devActionItems,
    fallbackReason,
    routeInventory: mockRouteInventory,
    contractReadiness: apiImplementationSteps,
    dataIntegrityChecks: mockDataIntegrityChecks,
    mutationReadinessContracts: mockMutationReadinessContracts,
    sectionFallbacks,
  };
}

export async function loadInternalMonitoringControlRoomData(): Promise<InternalMonitoringDataSourceResult> {
  const fallbackMessages: string[] = [];
  let source: InternalMonitoringSource = "api";

  async function loadSection<TData>(
    label: string,
    loader: () => Promise<{ data: TData }>,
    fallbackData: TData,
  ) {
    try {
      const response = await loader();
      return response.data;
    } catch (error) {
      source = "fallback";
      fallbackMessages.push(`${label}: ${getErrorMessage(error)}`);
      return fallbackData;
    }
  }

  const mock = getInternalMonitoringMockControlRoomData("fallback");
  const [
    controlRoom,
    routeInventory,
    contractReadiness,
    dataIntegrityChecks,
    mutationReadinessContracts,
  ] = await Promise.all([
    loadSection("health-summary", () => internalMonitoringApi.getControlRoom(), mock),
    loadSection("route-inventory", () => internalMonitoringApi.getRouteInventory(), mockRouteInventory),
    loadSection("contract-readiness", () => internalMonitoringApi.getContractReadiness(), apiImplementationSteps),
    loadSection("data-integrity", () => internalMonitoringApi.getDataIntegrityChecks(), mockDataIntegrityChecks),
    loadSection(
      "mutation-readiness",
      () => internalMonitoringApi.getMutationReadinessContracts(),
      mockMutationReadinessContracts,
    ),
  ]);

  return {
    ...controlRoom,
    source,
    fallbackReason: fallbackMessages.length > 0 ? fallbackMessages[0] : null,
    routeInventory,
    contractReadiness,
    dataIntegrityChecks,
    mutationReadinessContracts,
    sectionFallbacks: fallbackMessages,
  };
}
