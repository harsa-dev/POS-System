import { Router, type IRouter } from "express";

import { requireRole } from "../lib/auth.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { INTERNAL_MONITORING_POLICY } from "../services/platform-admin/internal-monitoring/internal-monitoring.policy.js";
import { internalMonitoringSuccessResponse } from "../services/platform-admin/internal-monitoring/internal-monitoring-response.js";
import {
  getInternalMonitoringContractReadiness,
  getInternalMonitoringControlRoom,
  getInternalMonitoringIntegrityChecks,
  getInternalMonitoringMutationReadiness,
  getInternalMonitoringRouteInventory,
} from "../services/platform-admin/internal-monitoring/internal-monitoring.service.js";

const router: IRouter = Router();

async function requireInternalMonitoringAccess(req: Parameters<typeof requireRole>[0], res: Parameters<typeof requireRole>[1]) {
  return requireRole(req, res, [...INTERNAL_MONITORING_POLICY.allowedRoles]);
}

router.get("/internal/health/summary", async (req, res) => {
  try {
    const user = await requireInternalMonitoringAccess(req, res);
    if (!user) return;

    const data = getInternalMonitoringControlRoom();

    return internalMonitoringSuccessResponse(res, {
      data,
      generatedAt: data.generatedAt,
      source: data.source,
      mock: true,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/internal/routes/inventory", async (req, res) => {
  try {
    const user = await requireInternalMonitoringAccess(req, res);
    if (!user) return;

    return internalMonitoringSuccessResponse(res, {
      data: getInternalMonitoringRouteInventory(),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/internal/contracts/readiness", async (req, res) => {
  try {
    const user = await requireInternalMonitoringAccess(req, res);
    if (!user) return;

    return internalMonitoringSuccessResponse(res, {
      data: getInternalMonitoringContractReadiness(),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/internal/data-integrity/checks", async (req, res) => {
  try {
    const user = await requireInternalMonitoringAccess(req, res);
    if (!user) return;

    return internalMonitoringSuccessResponse(res, {
      data: getInternalMonitoringIntegrityChecks(),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/internal/mutation-readiness/contracts", async (req, res) => {
  try {
    const user = await requireInternalMonitoringAccess(req, res);
    if (!user) return;

    return internalMonitoringSuccessResponse(res, {
      data: getInternalMonitoringMutationReadiness(),
      mutationMode: "design-only",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
