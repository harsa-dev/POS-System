import { Router, type IRouter } from "express";

import { requireRole } from "../lib/auth.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";
import { INTERNAL_MONITORING_POLICY } from "../services/platform-admin/internal-monitoring/internal-monitoring.policy.js";
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

    return successResponse(res, {
      data,
      meta: {
        generatedAt: data.generatedAt,
        source: data.source,
        mock: true,
        mode: INTERNAL_MONITORING_POLICY.mode,
        capability: INTERNAL_MONITORING_POLICY.capability,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/internal/routes/inventory", async (req, res) => {
  try {
    const user = await requireInternalMonitoringAccess(req, res);
    if (!user) return;

    return successResponse(res, {
      data: getInternalMonitoringRouteInventory(),
      meta: {
        generatedAt: new Date().toISOString(),
        source: "api",
        mock: true,
        mode: INTERNAL_MONITORING_POLICY.mode,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/internal/contracts/readiness", async (req, res) => {
  try {
    const user = await requireInternalMonitoringAccess(req, res);
    if (!user) return;

    return successResponse(res, {
      data: getInternalMonitoringContractReadiness(),
      meta: {
        generatedAt: new Date().toISOString(),
        source: "api",
        mock: true,
        mode: INTERNAL_MONITORING_POLICY.mode,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/internal/data-integrity/checks", async (req, res) => {
  try {
    const user = await requireInternalMonitoringAccess(req, res);
    if (!user) return;

    return successResponse(res, {
      data: getInternalMonitoringIntegrityChecks(),
      meta: {
        generatedAt: new Date().toISOString(),
        source: "api",
        mock: true,
        mode: INTERNAL_MONITORING_POLICY.mode,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/internal/mutation-readiness/contracts", async (req, res) => {
  try {
    const user = await requireInternalMonitoringAccess(req, res);
    if (!user) return;

    return successResponse(res, {
      data: getInternalMonitoringMutationReadiness(),
      meta: {
        generatedAt: new Date().toISOString(),
        source: "api",
        mock: true,
        mode: INTERNAL_MONITORING_POLICY.mode,
        capability: INTERNAL_MONITORING_POLICY.capability,
        mutationMode: "design-only",
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
