import { Router } from "express";
import { randomUUID } from "node:crypto";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

const PLANNED_MODE_REASON =
  "Sales sync for Customers & Partners is not operational for planned service/custom-business mode yet.";

type InvoiceCustomerAggregate = {
  identityKey: string;
  name: string;
  phone: string | null;
  address: string | null;
  totalSpending: number;
  transactions: number;
  lastInvoiceAt: Date | null;
};

type ExistingCustomer = {
  id: string;
  identityKey: string | null;
};

function isPlannedMode(businessMode: string) {
  return businessMode === "custom-business";
}

function requireSupportedMode(mode: string) {
  if (isPlannedMode(mode)) {
    throw new CustomersPartnersSalesSyncError(PLANNED_MODE_REASON, 403);
  }
}

class CustomersPartnersSalesSyncError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CustomersPartnersSalesSyncError";
    this.status = status;
  }
}

function respondInputError(res: Parameters<typeof errorResponse>[0], error: CustomersPartnersSalesSyncError) {
  return errorResponse(res, {
    status: error.status,
    code: error.status === 403 ? errorCodes.forbidden : errorCodes.validationError,
    message: error.message,
  });
}

async function ensureSalesSyncSchema() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SharedCustomerProfile" (
      "id" TEXT PRIMARY KEY,
      "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
      "name" TEXT NOT NULL,
      "phone" TEXT NULL,
      "email" TEXT NULL,
      "address" TEXT NULL,
      "totalSpending" INTEGER NOT NULL DEFAULT 0,
      "transactions" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "identityKey" TEXT NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "lastSalesSyncedAt" TIMESTAMPTZ NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "salesSourceCount" INTEGER NOT NULL DEFAULT 0;`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SharedCustomerProfile_businessId_identityKey_idx" ON "SharedCustomerProfile"("businessId", "identityKey");`);

  await prisma.$executeRawUnsafe(`
    UPDATE "SharedCustomerProfile"
    SET "identityKey" =
      lower(regexp_replace(trim("name"), '\\s+', ' ', 'g')) || '|' ||
      COALESCE(NULLIF(regexp_replace(COALESCE("phone", ''), '[^0-9]', '', 'g'), ''), 'no-phone')
    WHERE "identityKey" IS NULL
      AND "name" IS NOT NULL
  `);
}

async function getInvoiceCustomerAggregates(businessId: string, limit: number) {
  return prisma.$queryRaw<InvoiceCustomerAggregate[]>`
    WITH paid_invoice_customers AS (
      SELECT
        lower(regexp_replace(trim("customerName"), '\\s+', ' ', 'g')) || '|' ||
          COALESCE(NULLIF(regexp_replace(COALESCE("customerPhone", ''), '[^0-9]', '', 'g'), ''), 'no-phone') AS "identityKey",
        trim("customerName") AS "name",
        NULLIF(trim(COALESCE("customerPhone", '')), '') AS "phone",
        NULLIF(trim(COALESCE("customerAddress", '')), '') AS "address",
        "grandTotal" AS "grandTotal",
        "updatedAt" AS "invoiceUpdatedAt"
      FROM "Invoice"
      WHERE "businessId" = ${businessId}
        AND "status" = 'PAID'
        AND NULLIF(trim("customerName"), '') IS NOT NULL
    )
    SELECT
      "identityKey",
      max("name") AS "name",
      max("phone") AS "phone",
      max("address") AS "address",
      COALESCE(sum("grandTotal"), 0)::int AS "totalSpending",
      count(*)::int AS "transactions",
      max("invoiceUpdatedAt") AS "lastInvoiceAt"
    FROM paid_invoice_customers
    GROUP BY "identityKey"
    ORDER BY "lastInvoiceAt" DESC NULLS LAST, "totalSpending" DESC
    LIMIT ${limit}
  `;
}

async function findExistingCustomer(businessId: string, identityKey: string) {
  const rows = await prisma.$queryRaw<ExistingCustomer[]>`
    SELECT "id", "identityKey"
    FROM "SharedCustomerProfile"
    WHERE "businessId" = ${businessId}
      AND "identityKey" = ${identityKey}
      AND "isActive" = true
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function syncInvoiceCustomersFromSales(businessId: string) {
  const aggregates = await getInvoiceCustomerAggregates(businessId, 500);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const source of aggregates) {
    if (!source.identityKey || !source.name) {
      skipped += 1;
      continue;
    }

    const existing = await findExistingCustomer(businessId, source.identityKey);

    if (existing) {
      await prisma.$executeRaw`
        UPDATE "SharedCustomerProfile"
        SET
          "name" = ${source.name},
          "phone" = ${source.phone},
          "address" = ${source.address},
          "totalSpending" = ${source.totalSpending},
          "transactions" = ${source.transactions},
          "salesSourceCount" = ${source.transactions},
          "lastSalesSyncedAt" = now(),
          "updatedAt" = now()
        WHERE "id" = ${existing.id}
          AND "businessId" = ${businessId}
      `;
      updated += 1;
      continue;
    }

    await prisma.$executeRaw`
      INSERT INTO "SharedCustomerProfile" (
        "id", "businessId", "identityKey", "name", "phone", "email", "address",
        "totalSpending", "transactions", "salesSourceCount", "lastSalesSyncedAt", "updatedAt"
      ) VALUES (
        ${randomUUID()}, ${businessId}, ${source.identityKey}, ${source.name}, ${source.phone}, null, ${source.address},
        ${source.totalSpending}, ${source.transactions}, ${source.transactions}, now(), now()
      )
    `;
    created += 1;
  }

  return {
    source: "PAID_INVOICES",
    sourceCount: aggregates.length,
    created,
    updated,
    skipped,
    syncedAt: new Date().toISOString(),
  };
}

router.get("/customers-partners/sales-sync-preview", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    await ensureSalesSyncSchema();

    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const candidates = await getInvoiceCustomerAggregates(businessContext.businessId, limit);

    return successResponse(res, {
      data: {
        source: "PAID_INVOICES",
        candidateCount: candidates.length,
        candidates,
      },
    });
  } catch (error) {
    if (error instanceof CustomersPartnersSalesSyncError) return respondInputError(res, error);
    return handleApiError(res, error);
  }
});

router.post("/customers-partners/sync-from-sales", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    await ensureSalesSyncSchema();

    const result = await syncInvoiceCustomersFromSales(businessContext.businessId);
    return successResponse(res, {
      data: result,
      message: `Synced ${result.created + result.updated} customer profiles from paid invoices.`,
    });
  } catch (error) {
    if (error instanceof CustomersPartnersSalesSyncError) return respondInputError(res, error);
    return handleApiError(res, error);
  }
});

export default router;
