import type {
  InternalMonitoringControlRoomDto,
  InternalMonitoringDataIntegrityCheckDto,
  InternalMonitoringRouteInventoryItemDto,
} from "./internal-monitoring.types.js";
import {
  getInternalMonitoringApiImplementationSteps,
  getInternalMonitoringCards,
  getInternalMonitoringDataIntegrityChecks,
  getInternalMonitoringDevActionItems,
  getInternalMonitoringRouteInventory,
  getInternalMonitoringSchemaDecisionRecords,
  getInternalMonitoringSignals,
} from "./internal-monitoring.mock-repository.js";

function createSummary() {
  const signals = getInternalMonitoringSignals();
  const apiImplementationSteps = getInternalMonitoringApiImplementationSteps();
  const devActionItems = getInternalMonitoringDevActionItems();

  return {
    totalSignals: signals.length,
    blockedSignals: signals.filter((signal) => signal.state === "Blocked").length,
    readyContracts: apiImplementationSteps.filter((step) => step.contractStatus === "Ready").length,
    p0Actions: devActionItems.filter((item) => item.priority === "P0").length,
  };
}

export function getInternalMonitoringControlRoom(): InternalMonitoringControlRoomDto {
  return {
    source: "api",
    generatedAt: new Date().toISOString(),
    summary: createSummary(),
    cards: getInternalMonitoringCards(),
    signals: getInternalMonitoringSignals(),
    apiImplementationSteps: getInternalMonitoringApiImplementationSteps(),
    schemaDecisionRecords: getInternalMonitoringSchemaDecisionRecords(),
    devActionItems: getInternalMonitoringDevActionItems(),
  };
}

export function getInternalMonitoringRouteInventory(): InternalMonitoringRouteInventoryItemDto[] {
  return getInternalMonitoringRouteInventory();
}

export function getInternalMonitoringContractReadiness() {
  return getInternalMonitoringApiImplementationSteps();
}

export function getInternalMonitoringIntegrityChecks(): InternalMonitoringDataIntegrityCheckDto[] {
  return getInternalMonitoringDataIntegrityChecks();
}
