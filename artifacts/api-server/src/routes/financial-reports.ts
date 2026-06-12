import type { Role } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES } from "../lib/constants.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  getFinancialReport,
  parseFinancialReportRequest,
} from "../services/financial-reports/index.js";
import { exportFinancialReportFile, type ReportExportFormat } from "../services/financial-reports/report-export.js";
import { getFinancialReportReconciliation } from "../services/financial-reports/reconciliation.js";

const router = Router();

function getActor(user: { id: string; role: Role }) {
  return {
    id: user.id,
    role: user.role,
  };
}

function getQuery(query: unknown) {
  return parseFinancialReportRequest(query as Record<string, unknown>);
}

function getExportFormat(query: unknown): ReportExportFormat {
  const value = (query as Record<string, unknown>).format;
  return value === "csv" ? "csv" : "json";
}

router.get("/financial-reports", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await getFinancialReport({
      actor: getActor(user),
      businessContext,
      query: getQuery(req.query),
    });

    return successResponse(res, { data, message: "Financial report retrieved." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/financial-reports/export", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await exportFinancialReportFile({
      actor: getActor(user),
      businessContext,
      query: getQuery(req.query),
      format: getExportFormat(req.query),
    });

    return successResponse(res, { data, message: "Financial report export prepared." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/financial-reports/reconciliation", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await getFinancialReportReconciliation({
      actor: getActor(user),
      businessContext,
      query: getQuery(req.query),
    });

    return successResponse(res, {
      data,
      message: "Financial report reconciliation retrieved.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
