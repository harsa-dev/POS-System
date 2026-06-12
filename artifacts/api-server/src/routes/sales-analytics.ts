import type { Role } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES } from "../lib/constants.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  exportSalesAnalytics,
  getSalesAnalytics,
  getSalesAnalyticsReconciliation,
  parseSalesAnalyticsExportRequest,
  parseSalesAnalyticsRequest,
} from "../services/sales-analytics/index.js";

const router = Router();

function getActor(user: { id: string; role: Role }) {
  return {
    id: user.id,
    role: user.role,
  };
}

function getQuery(query: unknown) {
  return parseSalesAnalyticsRequest(query as Record<string, unknown>);
}

function getExportRequest(query: unknown) {
  return parseSalesAnalyticsExportRequest(query as Record<string, unknown>);
}

router.get("/sales-analytics", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await getSalesAnalytics({
      actor: getActor(user),
      businessContext,
      query: getQuery(req.query),
    });

    res.setHeader("Cache-Control", "no-store");
    return successResponse(res, { data, message: "Sales analytics retrieved." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/sales-analytics/reconciliation", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await getSalesAnalyticsReconciliation({
      actor: getActor(user),
      businessContext,
      query: getQuery(req.query),
    });

    res.setHeader("Cache-Control", "no-store");
    return successResponse(res, {
      data,
      message: "Sales analytics reconciliation retrieved.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/sales-analytics/export", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const exportRequest = getExportRequest(req.query);
    const data = await exportSalesAnalytics({
      actor: getActor(user),
      businessContext,
      query: exportRequest.query,
      format: exportRequest.format,
    });

    res.setHeader("Cache-Control", "no-store");
    return successResponse(res, { data, message: "Sales analytics export prepared." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
