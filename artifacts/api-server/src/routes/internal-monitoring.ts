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
  getInternalMonitoringProbeHistory,
  getInternalMonitoringRouteInventory,
} from "../services/platform-admin/internal-monitoring/internal-monitoring.service.js";
import type { InternalSystemProbeStatus } from "../services/platform-admin/internal-monitoring/internal-monitoring.types.js";

const router: IRouter = Router();

async function requireInternalMonitoringAccess(req: Parameters<typeof requireRole>[0], res: Parameters<typeof requireRole>[1]) {
  return requireRole(req, res, [...INTERNAL_MONITORING_POLICY.allowedRoles]);
}

function getStringQueryValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function getProbeStatusQueryValue(value: unknown): InternalSystemProbeStatus | undefined {
  const raw = getStringQueryValue(value);
  if (raw === "pass" || raw === "watch" || raw === "fail") return raw;
  return undefined;
}

function getLimitQueryValue(value: unknown) {
  const raw = getStringQueryValue(value);
  if (!raw) return undefined;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

router.get("/internal/health/summary", async (req, res) => {
  try {
    const user = await requireInternalMonitoringAccess(req, res);
    if (!user) return;

    const data = await getInternalMonitoringControlRoom();

    return internalMonitoringSuccessResponse(res, {
      data,
      generatedAt: data.generatedAt,
      source: data.source,
      mock: false,
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

router.get("/internal/probes/history", async (req, res) => {
  try {
    const user = await requireInternalMonitoringAccess(req, res);
    if (!user) return;

    const data = await getInternalMonitoringProbeHistory({
      probeId: getStringQueryValue(req.query.probeId),
      status: getProbeStatusQueryValue(req.query.status),
      area: getStringQueryValue(req.query.area),
      from: getStringQueryValue(req.query.from),
      to: getStringQueryValue(req.query.to),
      limit: getLimitQueryValue(req.query.limit),
    });

    return internalMonitoringSuccessResponse(res, {
      data,
      generatedAt: data.generatedAt,
      mock: false,
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
