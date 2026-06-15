import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { createBusinessScopeWhere, requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

const REVIEWABLE_ANOMALY_TYPES = [
  "NEGATIVE_STOCK",
  "MISSING_COST_SNAPSHOT",
  "SUSPICIOUS_ADJUSTMENT",
  "HIGH_VALUE_MOVEMENT",
] as const;

const REVIEW_STATUSES = ["REVIEWED", "IGNORED", "RESOLVED"] as const;

type ReviewableAnomalyType = (typeof REVIEWABLE_ANOMALY_TYPES)[number];
type ReviewStatus = (typeof REVIEW_STATUSES)[number];

type InventoryMovementAnomalyReviewRow = {
  id: string;
  businessId: string;
  anomalyId: string;
  anomalyType: ReviewableAnomalyType;
  movementId: string;
  status: ReviewStatus;
  note: string;
  reviewedById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function isReviewableAnomalyType(value: unknown): value is ReviewableAnomalyType {
  return typeof value === "string" && REVIEWABLE_ANOMALY_TYPES.includes(value as ReviewableAnomalyType);
}

function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && REVIEW_STATUSES.includes(value as ReviewStatus);
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function ensureInventoryMovementAnomalyReviewTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "InventoryMovementAnomalyReview" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "businessId" TEXT NOT NULL,
      "anomalyId" TEXT NOT NULL,
      "anomalyType" TEXT NOT NULL,
      "movementId" TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      "reviewedById" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "InventoryMovementAnomalyReview_business_anomaly_key"
      ON "InventoryMovementAnomalyReview" ("businessId", "anomalyId")
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "InventoryMovementAnomalyReview_business_status_idx"
      ON "InventoryMovementAnomalyReview" ("businessId", status)
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "InventoryMovementAnomalyReview_business_movement_idx"
      ON "InventoryMovementAnomalyReview" ("businessId", "movementId")
  `;
}

function reviewRowToDto(row: InventoryMovementAnomalyReviewRow) {
  return {
    id: row.id,
    businessId: row.businessId,
    anomalyId: row.anomalyId,
    anomalyType: row.anomalyType,
    movementId: row.movementId,
    status: row.status,
    note: row.note,
    reviewedById: row.reviewedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/inventory-movement-anomalies/reviews", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    await ensureInventoryMovementAnomalyReviewTable();

    const rows = await prisma.$queryRaw<InventoryMovementAnomalyReviewRow[]>`
      SELECT
        id,
        "businessId",
        "anomalyId" AS "anomalyId",
        "anomalyType" AS "anomalyType",
        "movementId" AS "movementId",
        status,
        note,
        "reviewedById" AS "reviewedById",
        "createdAt" AS "createdAt",
        "updatedAt" AS "updatedAt"
      FROM "InventoryMovementAnomalyReview"
      WHERE "businessId" = ${businessContext.businessId}
      ORDER BY "updatedAt" DESC
    `;

    return successResponse(res, {
      data: {
        rows: rows.map(reviewRowToDto),
      },
      message: "Inventory movement anomaly reviews retrieved.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/inventory-movement-anomalies/reviews", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const { anomalyId, anomalyType, movementId, status } = req.body as Record<string, unknown>;
    const note = normalizeText((req.body as Record<string, unknown>).note);

    if (typeof anomalyId !== "string" || anomalyId.trim().length === 0) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Anomaly id is required.",
      });
    }

    if (!isReviewableAnomalyType(anomalyType)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Invalid inventory movement anomaly type.",
      });
    }

    if (typeof movementId !== "string" || movementId.trim().length === 0) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Movement id is required.",
      });
    }

    if (!isReviewStatus(status)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Invalid inventory movement anomaly review status.",
      });
    }

    if (note.length === 0) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Review note is required.",
      });
    }

    const movement = await prisma.stockMovement.findFirst({
      where: {
        id: movementId.trim(),
        inventoryItem: createBusinessScopeWhere(businessContext),
      },
      select: { id: true },
    });

    if (!movement) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Inventory movement not found for this business.",
      });
    }

    await ensureInventoryMovementAnomalyReviewTable();

    const reviewRows = await prisma.$queryRaw<InventoryMovementAnomalyReviewRow[]>`
      INSERT INTO "InventoryMovementAnomalyReview" (
        "businessId",
        "anomalyId",
        "anomalyType",
        "movementId",
        status,
        note,
        "reviewedById",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${businessContext.businessId},
        ${anomalyId.trim()},
        ${anomalyType},
        ${movementId.trim()},
        ${status},
        ${note},
        ${user.id},
        NOW(),
        NOW()
      )
      ON CONFLICT ("businessId", "anomalyId")
      DO UPDATE SET
        status = EXCLUDED.status,
        note = EXCLUDED.note,
        "reviewedById" = EXCLUDED."reviewedById",
        "updatedAt" = NOW()
      RETURNING
        id,
        "businessId",
        "anomalyId" AS "anomalyId",
        "anomalyType" AS "anomalyType",
        "movementId" AS "movementId",
        status,
        note,
        "reviewedById" AS "reviewedById",
        "createdAt" AS "createdAt",
        "updatedAt" AS "updatedAt"
    `;

    const review = reviewRows[0];
    if (!review) {
      return errorResponse(res, {
        status: 500,
        code: errorCodes.internalServerError,
        message: "Failed to save inventory movement anomaly review.",
      });
    }

    return successResponse(res, {
      data: reviewRowToDto(review),
      message: "Inventory movement anomaly review saved.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
