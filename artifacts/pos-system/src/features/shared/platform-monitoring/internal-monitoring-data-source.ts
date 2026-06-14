import {
  internalMonitoringApi,
  type InternalMonitoringApiImplementationStepDto,
  type InternalMonitoringControlRoomDto,
  type InternalMonitoringDataIntegrityCheckDto,
  type InternalMonitoringRouteInventoryItemDto,
  type InternalMonitoringSource,
} from "@/lib/api/internal-monitoring-api";

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
  sectionFallbacks: string[];
};

const mockRouteInventory: InternalMonitoringRouteInventoryItemDto[] = [
  {
    id: "internal-monitoring",
    route: "/dashboard/internal-monitoring",
    owner: "Platform Admin",
    guard: "auth",
    status: "active",
    notes: "Frontend route is mounted. Dedicated Platform Admin guard is planned next.",
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
  const [controlRoom, routeInventory, contractReadiness, dataIntegrityChecks] = await Promise.all([
    loadSection("health-summary", () => internalMonitoringApi.getControlRoom(), mock),
    loadSection("route-inventory", () => internalMonitoringApi.getRouteInventory(), mockRouteInventory),
    loadSection("contract-readiness", () => internalMonitoringApi.getContractReadiness(), apiImplementationSteps),
    loadSection("data-integrity", () => internalMonitoringApi.getDataIntegrityChecks(), mockDataIntegrityChecks),
  ]);

  return {
    ...controlRoom,
    source,
    fallbackReason: fallbackMessages.length > 0 ? fallbackMessages[0] : null,
    routeInventory,
    contractReadiness,
    dataIntegrityChecks,
    sectionFallbacks: fallbackMessages,
  };
}
