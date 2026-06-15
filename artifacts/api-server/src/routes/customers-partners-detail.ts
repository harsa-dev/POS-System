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

const PLANNED_MODE_REASON =
  "Customers & Partners is not operational for planned service/custom-business mode yet.";

type CustomerDetailRow = {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalSpending: number;
  transactions: number;
  loyaltyTierId: string | null;
  loyaltyTierName: string | null;
  loyaltyTierIcon: string | null;
  loyaltyDiscount: string | null;
  tierAssignedAt: Date | null;
  isActive: boolean;
  identityKey: string | null;
  lastSalesSyncedAt: Date | null;
  salesSourceCount: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type SupplierDetailRow = {
  id: string;
  businessId: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalPurchases: number;
  transactions: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function isPlannedMode(businessMode: string) {
  return businessMode === "custom-business";
}

async function ensureDetailSchema() {
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

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SharedBusinessPartner" (
      "id" TEXT PRIMARY KEY,
      "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
      "partnerType" TEXT NOT NULL DEFAULT 'SUPPLIER',
      "name" TEXT NOT NULL,
      "phone" TEXT NULL,
      "email" TEXT NULL,
      "address" TEXT NULL,
      "totalPurchases" INTEGER NOT NULL DEFAULT 0,
      "transactions" INTEGER NOT NULL DEFAULT 0,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "identityKey" TEXT NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "lastSalesSyncedAt" TIMESTAMPTZ NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "salesSourceCount" INTEGER NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "loyaltyTierId" TEXT NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "loyaltyTierName" TEXT NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "loyaltyTierIcon" TEXT NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "loyaltyDiscount" TEXT NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "tierAssignedAt" TIMESTAMPTZ NULL;`);
}

async function getCustomerDetail(businessId: string, id: string) {
  const rows = await prisma.$queryRaw<CustomerDetailRow[]>`
    SELECT
      "id", "businessId", "name", "phone", "email", "address",
      "totalSpending", "transactions", "loyaltyTierId", "loyaltyTierName",
      "loyaltyTierIcon", "loyaltyDiscount", "tierAssignedAt", "isActive", "identityKey",
      "lastSalesSyncedAt", "salesSourceCount", "createdAt", "updatedAt"
    FROM "SharedCustomerProfile"
    WHERE "businessId" = ${businessId}
      AND "id" = ${id}
      AND "isActive" = true
    LIMIT 1
  `;

  return rows[0] ?? null;
}

async function getSupplierDetail(businessId: string, id: string) {
  const rows = await prisma.$queryRaw<SupplierDetailRow[]>`
    SELECT
      "id", "businessId", "name", "phone", "email", "address",
      "totalPurchases", "transactions", "isActive", "createdAt", "updatedAt"
    FROM "SharedBusinessPartner"
    WHERE "businessId" = ${businessId}
      AND "id" = ${id}
      AND "partnerType" = 'SUPPLIER'
      AND "isActive" = true
    LIMIT 1
  `;

  return rows[0] ?? null;
}

router.get("/customers-partners/customers/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    if (isPlannedMode(businessContext.businessMode)) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: PLANNED_MODE_REASON,
      });
    }

    await ensureDetailSchema();
    const customer = await getCustomerDetail(businessContext.businessId, req.params.id);
    if (!customer) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Customer not found.",
      });
    }

    return successResponse(res, { data: { kind: "customer", contact: customer } });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/customers-partners/suppliers/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    if (isPlannedMode(businessContext.businessMode)) {
      return errorResponse(res, {
        status: 403,
        code: errorCodes.forbidden,
        message: PLANNED_MODE_REASON,
      });
    }

    await ensureDetailSchema();
    const supplier = await getSupplierDetail(businessContext.businessId, req.params.id);
    if (!supplier) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Supplier not found.",
      });
    }

    return successResponse(res, { data: { kind: "supplier", contact: supplier } });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
