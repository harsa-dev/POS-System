import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

const REVIEWABLE_ISSUES = [
  "orders_without_paid_payment",
  "payment_total_mismatch",
] as const;

const REVIEW_STATUSES = ["REVIEWED", "IGNORED", "RESOLVED"] as const;

type ReviewableIssue = (typeof REVIEWABLE_ISSUES)[number];
type ReviewStatus = (typeof REVIEW_STATUSES)[number];

type IntegrityReviewRow = {
  id: string;
  businessId: string;
  issueType: ReviewableIssue;
  orderId: string;
  status: ReviewStatus;
  note: string;
  reviewedById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function isReviewableIssue(value: unknown): value is ReviewableIssue {
  return typeof value === "string" && REVIEWABLE_ISSUES.includes(value as ReviewableIssue);
}

function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && REVIEW_STATUSES.includes(value as ReviewStatus);
}

function normalizeNote(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function ensureSalesPaymentIntegrityReviewTable() {
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "SalesPaymentIntegrityReview" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "businessId" TEXT NOT NULL,
      "issueType" TEXT NOT NULL,
      "orderId" TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      "reviewedById" TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "SalesPaymentIntegrityReview_business_issue_order_key"
      ON "SalesPaymentIntegrityReview" ("businessId", "issueType", "orderId")
  `;

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "SalesPaymentIntegrityReview_business_status_idx"
      ON "SalesPaymentIntegrityReview" ("businessId", status)
  `;
}

function reviewRowToDto(row: IntegrityReviewRow) {
  return {
    id: row.id,
    businessId: row.businessId,
    issueType: row.issueType,
    orderId: row.orderId,
    status: row.status,
    note: row.note,
    reviewedById: row.reviewedById,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/sales-analytics/payment-integrity/reviews", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    await ensureSalesPaymentIntegrityReviewTable();

    const rows = await prisma.$queryRaw<IntegrityReviewRow[]>`
      SELECT
        id,
        "businessId",
        "issueType" AS "issueType",
        "orderId" AS "orderId",
        status,
        note,
        "reviewedById" AS "reviewedById",
        "createdAt" AS "createdAt",
        "updatedAt" AS "updatedAt"
      FROM "SalesPaymentIntegrityReview"
      WHERE "businessId" = ${businessContext.businessId}
      ORDER BY "updatedAt" DESC
    `;

    return successResponse(res, {
      data: {
        rows: rows.map(reviewRowToDto),
      },
      message: "Sales payment integrity reviews retrieved.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/sales-analytics/payment-integrity/reviews", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const { issueType, orderId, status } = req.body as Record<string, unknown>;
    const note = normalizeNote((req.body as Record<string, unknown>).note);

    if (!isReviewableIssue(issueType)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Invalid payment integrity issue type.",
      });
    }

    if (typeof orderId !== "string" || orderId.trim().length === 0) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Order id is required.",
      });
    }

    if (!isReviewStatus(status)) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Invalid payment integrity review status.",
      });
    }

    if (note.length === 0) {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Review note is required.",
      });
    }

    await ensureSalesPaymentIntegrityReviewTable();

    const reviewRows = await prisma.$queryRaw<IntegrityReviewRow[]>`
      INSERT INTO "SalesPaymentIntegrityReview" (
        "businessId",
        "issueType",
        "orderId",
        status,
        note,
        "reviewedById",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${businessContext.businessId},
        ${issueType},
        ${orderId.trim()},
        ${status},
        ${note},
        ${user.id},
        NOW(),
        NOW()
      )
      ON CONFLICT ("businessId", "issueType", "orderId")
      DO UPDATE SET
        status = EXCLUDED.status,
        note = EXCLUDED.note,
        "reviewedById" = EXCLUDED."reviewedById",
        "updatedAt" = NOW()
      RETURNING
        id,
        "businessId",
        "issueType" AS "issueType",
        "orderId" AS "orderId",
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
        message: "Failed to save payment integrity review.",
      });
    }

    return successResponse(res, {
      data: reviewRowToDto(review),
      message: "Sales payment integrity review saved.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
