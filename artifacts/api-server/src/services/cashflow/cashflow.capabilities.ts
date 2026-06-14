import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { hasPermission, permissionKeys } from "../permissions/index.js";
import type { CashflowActor } from "./cashflow.types.js";

export type CashflowCapabilitiesDto = {
  businessMode: BusinessContext["businessMode"];
  businessId: string;
  canView: boolean;
  canCreate: boolean;
  canSync: boolean;
  canVoid: boolean;
  canExport: boolean;
  isPlannedMode: boolean;
  plannedReason: string | null;
};

export function getCashflowCapabilities(params: {
  actor: CashflowActor;
  businessContext: BusinessContext;
}): CashflowCapabilitiesDto {
  const businessMode = params.businessContext.businessMode;
  const isPlannedMode = businessMode === "custom-business";

  return {
    businessMode,
    businessId: params.businessContext.businessId,
    canView: hasPermission(params.actor.role, permissionKeys.shared.cashflow.view),
    canCreate:
      !isPlannedMode &&
      hasPermission(params.actor.role, permissionKeys.shared.cashflow.create),
    canSync:
      !isPlannedMode &&
      hasPermission(params.actor.role, permissionKeys.shared.cashflow.sync),
    canVoid:
      !isPlannedMode &&
      hasPermission(params.actor.role, permissionKeys.shared.cashflow.void),
    canExport: hasPermission(params.actor.role, permissionKeys.shared.cashflow.export),
    isPlannedMode,
    plannedReason: isPlannedMode
      ? "Service/custom business cashflow is planned and not operational yet."
      : null,
  };
}
