import type {
  InternalMonitoringControlRoomCardDto,
  InternalMonitoringControlRoomDto,
  InternalMonitoringControlRoomSignalDto,
  InternalMonitoringDataIntegrityCheckDto,
  InternalMonitoringRouteInventoryItemDto,
  InternalMonitoringRuntimeProbeDto,
  InternalSystemProbeHistoryDto,
  InternalSystemProbeStatus,
} from "./internal-monitoring.types.js";
import {
  getInternalMonitoringMutationReadinessContracts,
} from "./internal-monitoring-mutation-readiness.js";
import { getInternalSystemProbeHistory } from "./internal-system-probe-history.js";
import {
  getInternalMonitoringApiImplementationSteps,
  getInternalMonitoringCards,
  getInternalMonitoringDataIntegrityChecks,
  getInternalMonitoringDevActionItems,
  getInternalMonitoringRouteInventory as getMockInternalMonitoringRouteInventory,
  getInternalMonitoringSchemaDecisionRecords,
  getInternalMonitoringSignals,
} from "./internal-monitoring.mock-repository.js";
import { collectInternalMonitoringRuntimeProbes } from "./internal-monitoring-runtime-probes.js";

function getProbeTone(probes: InternalMonitoringRuntimeProbeDto[]) {
  if (probes.some((probe) => probe.status === "fail")) return "rose";
  if (probes.some((probe) => probe.status === "watch")) return "amber";
  return "green";
}

function createSummary(runtimeProbes: InternalMonitoringRuntimeProbeDto[]) {
  const signals = getInternalMonitoringSignals();
  const apiImplementationSteps = getInternalMonitoringApiImplementationSteps();
  const devActionItems = getInternalMonitoringDevActionItems();

  return {
    totalSignals: signals.length,
    blockedSignals: signals.filter((signal) => signal.state === "Blocked").length,
    readyContracts: apiImplementationSteps.filter((step) => step.contractStatus === "Ready").length,
    p0Actions: devActionItems.filter((item) => item.priority === "P0").length,
    runtimeProbes: runtimeProbes.length,
    failingRuntimeProbes: runtimeProbes.filter((probe) => probe.status === "fail").length,
  };
}

function createRuntimeProbeCard(runtimeProbes: InternalMonitoringRuntimeProbeDto[]): InternalMonitoringControlRoomCardDto {
  const failingProbes = runtimeProbes.filter((probe) => probe.status === "fail").length;
  const watchProbes = runtimeProbes.filter((probe) => probe.status === "watch").length;
  const healthyProbes = runtimeProbes.filter((probe) => probe.status === "pass").length;

  return {
    id: "runtime-probes",
    label: "Runtime Probes",
    value: `${healthyProbes}/${runtimeProbes.length}`,
    note: failingProbes > 0
      ? `${failingProbes} probe failed. Check runtime probe table before trusting API readiness.`
      : watchProbes > 0
        ? `${watchProbes} probe needs attention, but the dashboard remains read-only.`
        : "API runtime, environment, contract, and database probes responded safely.",
    tone: getProbeTone(runtimeProbes),
  };
}

function createRuntimeProbeSignals(runtimeProbes: InternalMonitoringRuntimeProbeDto[]): InternalMonitoringControlRoomSignalDto[] {
  return runtimeProbes.map((probe) => ({
    id: `runtime-probe-${probe.id}`,
    area: "Runtime Probe",
    signal: `${probe.label}: ${probe.detail}`,
    source: probe.source,
    state: probe.status === "pass" ? "Healthy" : probe.status === "watch" ? "Watch" : "Blocked",
    nextAction: probe.status === "pass"
      ? "Keep runtime probe in read-only monitoring summary."
      : "Inspect runtime probe detail before promoting this dashboard to persistent monitoring.",
  }));
}

export async function getInternalMonitoringControlRoom(): Promise<InternalMonitoringControlRoomDto> {
  const runtimeProbes = await collectInternalMonitoringRuntimeProbes();
  const generatedAt = new Date().toISOString();

  return {
    source: "api",
    generatedAt,
    summary: createSummary(runtimeProbes),
    cards: [createRuntimeProbeCard(runtimeProbes), ...getInternalMonitoringCards()],
    runtimeProbes,
    signals: [...createRuntimeProbeSignals(runtimeProbes), ...getInternalMonitoringSignals()],
    apiImplementationSteps: getInternalMonitoringApiImplementationSteps(),
    schemaDecisionRecords: getInternalMonitoringSchemaDecisionRecords(),
    devActionItems: getInternalMonitoringDevActionItems(),
  };
}

export function getInternalMonitoringRouteInventory(): InternalMonitoringRouteInventoryItemDto[] {
  return getMockInternalMonitoringRouteInventory();
}

export function getInternalMonitoringContractReadiness() {
  return getInternalMonitoringApiImplementationSteps();
}

export function getInternalMonitoringIntegrityChecks(): InternalMonitoringDataIntegrityCheckDto[] {
  return getInternalMonitoringDataIntegrityChecks();
}

export function getInternalMonitoringMutationReadiness() {
  return getInternalMonitoringMutationReadinessContracts();
}

export function getInternalMonitoringProbeHistory(query: {
  probeId?: string;
  status?: InternalSystemProbeStatus;
  area?: string;
  from?: string;
  to?: string;
  limit?: number;
} = {}): Promise<InternalSystemProbeHistoryDto> {
  return getInternalSystemProbeHistory(query);
}
