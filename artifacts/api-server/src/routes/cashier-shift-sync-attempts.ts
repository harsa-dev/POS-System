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
  listShiftSyncAttemptHistory,
  markShiftSyncAttemptFailed,
  markShiftSyncAttemptSuccess,
  type ShiftSyncAttemptLogRecord,
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

function serializeAttempt(attempt: ShiftSyncAttemptLogRecord) {
  return {
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
  };
}

function buildAttemptSummary(attempts: ShiftSyncAttemptLogRecord[]) {
  return attempts.reduce(
    (summary, attempt) => {
      summary.totalAttempts += 1;
      if (attempt.status === "SUCCESS") summary.successCount += 1;
      if (attempt.status === "FAILED") summary.failedCount += 1;
      if (attempt.status === "RUNNING") summary.runningCount += 1;
      summary.latestStatus = summary.latestStatus ?? attempt.status;
      summary.latestAttemptNumber = summary.latestAttemptNumber ?? attempt.attemptNumber;
      summary.latestErrorMessage = summary.latestErrorMessage ?? attempt.errorMessage;
      summary.latestUpdatedAt = summary.latestUpdatedAt ?? attempt.updatedAt.toISOString();
      return summary;
    },
    {
      totalAttempts: 0,
      successCount: 0,
      failedCount: 0,
      runningCount: 0,
      latestStatus: null as string | null,
      latestAttemptNumber: null as number | null,
      latestErrorMessage: null as string | null,
      latestUpdatedAt: null as string | null,
    },
  );
}

function csvEscape(value: unknown) {
  const raw = value == null ? "" : String(value);
  return `"${raw.replaceAll('"', '""')}"`;
}

function buildAttemptCsv(attempts: ShiftSyncAttemptLogRecord[]) {
  const headers = [
    "Shift ID",
    "Attempt Number",
    "Status",
    "Error Code",
    "Error Message",
    "Cashflow Entry ID",
    "Actor ID",
    "Actor Role",
    "Created At",
    "Updated At",
  ];

  const rows = attempts.map((attempt) => [
    attempt.shiftId,
    attempt.attemptNumber,
    attempt.status,
    attempt.errorCode,
    attempt.errorMessage,
    attempt.cashflowEntryId,
    attempt.actorId,
    attempt.actorRole,
    attempt.createdAt.toISOString(),
    attempt.updatedAt.toISOString(),
  ]);

  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function getLimit(value: unknown, fallback = 50) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = typeof raw === "string" ? Number(raw) : fallback;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), 1), 500);
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
      data: Array.from(attempts.values()).map(serializeAttempt),
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/cashier-shift-reports/sync-attempts/:shiftId", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const attempts = await listShiftSyncAttemptHistory({
      businessId: businessContext.businessId,
      shiftId: req.params.shiftId,
      limit: getLimit(req.query.limit),
    });

    return successResponse(res, {
      data: {
        shiftId: req.params.shiftId,
        summary: buildAttemptSummary(attempts),
        attempts: attempts.map(serializeAttempt),
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/cashier-shift-reports/sync-attempts/:shiftId/export", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const format = req.query.format === "json" ? "json" : "csv";
    const attempts = await listShiftSyncAttemptHistory({
      businessId: businessContext.businessId,
      shiftId: req.params.shiftId,
      limit: getLimit(req.query.limit, 500),
    });

    if (format === "json") {
      return successResponse(res, {
        data: {
          shiftId: req.params.shiftId,
          summary: buildAttemptSummary(attempts),
          attempts: attempts.map(serializeAttempt),
          meta: {
            exportedAt: new Date().toISOString(),
            rowCount: attempts.length,
            limit: getLimit(req.query.limit, 500),
          },
        },
      });
    }

    const csv = buildAttemptCsv(attempts);
    const exportedAt = new Date().toISOString();
    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader(
      "content-disposition",
      `attachment; filename="cashier-shift-sync-attempts-${req.params.shiftId.slice(0, 8)}.csv"`,
    );
    res.setHeader("x-row-count", String(attempts.length));
    res.setHeader("x-exported-at", exportedAt);
    return res.status(200).send(csv);
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
