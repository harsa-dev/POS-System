import type { Role } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES } from "../lib/constants.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  exportFinancialReport,
  getFinancialReport,
  parseFinancialReportRequest,
} from "../services/financial-reports/index.js";

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
    const data = await exportFinancialReport({
      actor: getActor(user),
      businessContext,
      query: getQuery(req.query),
    });

    return successResponse(res, { data, message: "Financial report export prepared." });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
