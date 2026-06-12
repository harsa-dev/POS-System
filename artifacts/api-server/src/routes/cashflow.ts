import type { Role } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES } from "../lib/constants.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  createManualCashflowEntry,
  getCashflowDashboard,
  listCashflowEntries,
  parseCashflowListQuery,
  syncOrderPaymentToCashflow,
  syncShiftCloseToCashflow,
  voidCashflowEntry,
} from "../services/cashflow/index.js";

const router = Router();

function getActor(user: { id: string; role: Role }) {
  return {
    id: user.id,
    role: user.role,
  };
}

function getQuery(query: unknown) {
  return parseCashflowListQuery(query as Record<string, unknown>);
}

router.get("/cashflow-dashboard", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await getCashflowDashboard({
      actor: getActor(user),
      businessContext,
      query: getQuery(req.query),
    });

    return successResponse(res, { data });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/cashflow-entries", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await listCashflowEntries({
      actor: getActor(user),
      businessContext,
      query: getQuery(req.query),
    });

    return successResponse(res, {
      data: data.entries,
      meta: {
        pagination: data.pagination,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/cashflow-entries", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await createManualCashflowEntry({
      actor: getActor(user),
      businessContext,
      input: req.body ?? {},
    });

    return successResponse(res, {
      data,
      status: 201,
      message: "Cashflow entry created.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/cashflow/sync/orders/:orderId", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await syncOrderPaymentToCashflow({
      actor: getActor(user),
      businessContext,
      orderId: req.params.orderId,
    });

    return successResponse(res, {
      data,
      message: "Order payment synced to cashflow.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/cashflow/sync/shifts/:shiftId", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await syncShiftCloseToCashflow({
      actor: getActor(user),
      businessContext,
      shiftId: req.params.shiftId,
    });

    return successResponse(res, {
      data,
      message: "Shift close synced to cashflow.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.patch("/cashflow-entries/:id/void", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const data = await voidCashflowEntry({
      actor: getActor(user),
      businessContext,
      id: req.params.id,
    });

    return successResponse(res, {
      data,
      message: "Cashflow entry voided.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
