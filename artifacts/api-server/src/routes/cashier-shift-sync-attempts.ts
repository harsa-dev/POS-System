import type { Role } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { isAppError } from "../lib/errors/app-error.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import {
  createShiftSyncAttempt,
  ensureShiftSyncAttemptTable,
  listLatestShiftSyncAttempts,
  markShiftSyncAttemptFailed,
  markShiftSyncAttemptSuccess,
} from "../lib/shift-sync-attempt-log.js";
import { successResponse } from "../lib/responses/success-response.js";
import { syncShiftCloseToCashflow } from "../services/cashflow/index.js";

const router = Router();

function getActor(user: { id: string; role: Role }) {
  return {
    id: user.id,
    role: user.role,
  };
}

function getErrorDetails(error: unknown) {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      code: null,
      message: error.message,
    };
  }

  return {
    code: null,
    message: "Unknown shift sync error.",
  };
}

router.post("/cashflow/sync/shifts/:shiftId", async (req, res) => {
  const attemptContext: { attemptId: string | null } = { attemptId: null };

  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const attempt = await createShiftSyncAttempt({
      businessId: businessContext.businessId,
      shiftId: req.params.shiftId,
      actorId: user.id,
      actorRole: user.role,
    });
    attemptContext.attemptId = attempt?.id ?? null;

    const data = await syncShiftCloseToCashflow({
      actor: getActor(user),
      businessContext,
      shiftId: req.params.shiftId,
    });

    await markShiftSyncAttemptSuccess({
      attemptId: attempt.id,
      cashflowEntryId: data.id ?? null,
    });

    return successResponse(res, {
      data: {
        ...data,
        syncAttempt: {
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          status: "SUCCESS",
        },
      },
      message: "Shift close synced to cashflow.",
    });
  } catch (error) {
    if (attemptContext.attemptId) {
      const details = getErrorDetails(error);
      await markShiftSyncAttemptFailed({
        attemptId: attemptContext.attemptId,
        errorCode: details.code,
        errorMessage: details.message,
      });
    }

    return handleApiError(res, error);
  }
});

router.get("/cashier-shift-reports/sync-attempts", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const rawShiftIds = req.query.shiftIds;
    const shiftIds = Array.isArray(rawShiftIds)
      ? rawShiftIds.filter((value): value is string => typeof value === "string")
      : typeof rawShiftIds === "string" && rawShiftIds.trim().length > 0
        ? rawShiftIds.split(",").map((value) => value.trim()).filter(Boolean)
        : [];

    await ensureShiftSyncAttemptTable();
    const attempts = await listLatestShiftSyncAttempts({
      businessId: businessContext.businessId,
      shiftIds,
    });

    return successResponse(res, {
      data: Array.from(attempts.values()).map((attempt) => ({
        id: attempt.id,
        shiftId: attempt.shiftId,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        errorCode: attempt.errorCode,
        errorMessage: attempt.errorMessage,
        cashflowEntryId: attempt.cashflowEntryId,
        actorId: attempt.actorId,
        actorRole: attempt.actorRole,
        createdAt: attempt.createdAt.toISOString(),
        updatedAt: attempt.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
