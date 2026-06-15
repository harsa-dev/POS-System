import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { ALL_ROLES, MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();

const PLANNED_MODE_REASON =
  "Customers & Partners is not operational for planned service/custom-business mode yet.";

type TierAssignmentCustomerRow = {
  id: string;
  name: string;
  totalSpending: number;
  transactions: number;
  loyaltyTierId: string | null;
  loyaltyTierName: string | null;
  loyaltyTierIcon: string | null;
  loyaltyDiscount: string | null;
  tierAssignedAt: Date | null;
};

type TierSettingRow = {
  id: string;
  icon: string;
  tierName: string;
  minimumSpending: number;
  automaticDiscount: string;
  sortOrder: number;
};

type TierAssignmentRow = {
  customerId: string;
  customerName: string;
  totalSpending: number;
  transactions: number;
  currentTierId: string | null;
  currentTierName: string | null;
  assignedTierId: string | null;
  assignedTierName: string | null;
  assignedTierIcon: string | null;
  assignedDiscount: string | null;
  tierAssignedAt: Date | null;
  changed: boolean;
};

function isPlannedMode(businessMode: string) {
  return businessMode === "custom-business";
}

function requireSupportedMode(mode: string) {
  if (isPlannedMode(mode)) {
    const error = new Error(PLANNED_MODE_REASON) as Error & { status?: number };
    error.status = 403;
    throw error;
  }
}

async function ensureTierAssignmentSchema() {
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
    CREATE TABLE IF NOT EXISTS "SharedLoyaltyTierSetting" (
      "id" TEXT PRIMARY KEY,
      "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
      "icon" TEXT NOT NULL,
      "tierName" TEXT NOT NULL,
      "calculationPeriod" TEXT NOT NULL DEFAULT 'Last 12 months',
      "minimumSpending" INTEGER NOT NULL DEFAULT 0,
      "automaticDiscount" TEXT NOT NULL DEFAULT '0%',
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "loyaltyTierId" TEXT NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "loyaltyTierName" TEXT NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "loyaltyTierIcon" TEXT NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "loyaltyDiscount" TEXT NULL;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "SharedCustomerProfile" ADD COLUMN IF NOT EXISTS "tierAssignedAt" TIMESTAMPTZ NULL;`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SharedCustomerProfile_loyaltyTierName_idx" ON "SharedCustomerProfile"("loyaltyTierName");`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "SharedLoyaltyTierSetting_businessId_tierName_key" ON "SharedLoyaltyTierSetting"("businessId", "tierName");`);
}

async function listCustomersForAssignment(businessId: string) {
  return prisma.$queryRaw<TierAssignmentCustomerRow[]>`
    SELECT
      "id", "name", "totalSpending", "transactions",
      "loyaltyTierId", "loyaltyTierName", "loyaltyTierIcon", "loyaltyDiscount", "tierAssignedAt"
    FROM "SharedCustomerProfile"
    WHERE "businessId" = ${businessId}
      AND "isActive" = true
    ORDER BY "totalSpending" DESC, "updatedAt" DESC
  `;
}

async function listTierSettingsForAssignment(businessId: string) {
  return prisma.$queryRaw<TierSettingRow[]>`
    SELECT "id", "icon", "tierName", "minimumSpending", "automaticDiscount", "sortOrder"
    FROM "SharedLoyaltyTierSetting"
    WHERE "businessId" = ${businessId}
    ORDER BY "minimumSpending" DESC, "sortOrder" DESC
  `;
}

function getAssignedTier(totalSpending: number, tiers: TierSettingRow[]) {
  return tiers.find((tier) => totalSpending >= tier.minimumSpending) ?? null;
}

function buildAssignmentRows(customers: TierAssignmentCustomerRow[], tiers: TierSettingRow[]) {
  return customers.map<TierAssignmentRow>((customer) => {
    const assignedTier = getAssignedTier(customer.totalSpending, tiers);
    return {
      customerId: customer.id,
      customerName: customer.name,
      totalSpending: customer.totalSpending,
      transactions: customer.transactions,
      currentTierId: customer.loyaltyTierId,
      currentTierName: customer.loyaltyTierName,
      assignedTierId: assignedTier?.id ?? null,
      assignedTierName: assignedTier?.tierName ?? null,
      assignedTierIcon: assignedTier?.icon ?? null,
      assignedDiscount: assignedTier?.automaticDiscount ?? null,
      tierAssignedAt: customer.tierAssignedAt,
      changed: (customer.loyaltyTierId ?? null) !== (assignedTier?.id ?? null),
    };
  });
}

function buildSummary(rows: TierAssignmentRow[]) {
  const byTier = rows.reduce<Record<string, number>>((acc, row) => {
    const key = row.assignedTierName ?? "Unassigned";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    customerCount: rows.length,
    assignedCount: rows.filter((row) => row.assignedTierId).length,
    unassignedCount: rows.filter((row) => !row.assignedTierId).length,
    changedCount: rows.filter((row) => row.changed).length,
    byTier,
  };
}

async function buildAssignmentPreview(businessId: string) {
  const [customers, tiers] = await Promise.all([
    listCustomersForAssignment(businessId),
    listTierSettingsForAssignment(businessId),
  ]);
  const rows = buildAssignmentRows(customers, tiers);

  return {
    generatedAt: new Date().toISOString(),
    summary: buildSummary(rows),
    rows,
  };
}

async function commitAssignments(businessId: string) {
  const preview = await buildAssignmentPreview(businessId);

  for (const row of preview.rows) {
    await prisma.$executeRaw`
      UPDATE "SharedCustomerProfile"
      SET
        "loyaltyTierId" = ${row.assignedTierId},
        "loyaltyTierName" = ${row.assignedTierName},
        "loyaltyTierIcon" = ${row.assignedTierIcon},
        "loyaltyDiscount" = ${row.assignedDiscount},
        "tierAssignedAt" = now(),
        "updatedAt" = now()
      WHERE "businessId" = ${businessId}
        AND "id" = ${row.customerId}
        AND "isActive" = true
    `;
  }

  return {
    assignedAt: new Date().toISOString(),
    summary: preview.summary,
    rows: preview.rows,
  };
}

function handlePlannedError(res: Parameters<typeof errorResponse>[0], error: unknown) {
  const status = typeof (error as { status?: unknown }).status === "number"
    ? (error as { status: number }).status
    : 500;

  if (status !== 403) return false;

  errorResponse(res, {
    status: 403,
    code: errorCodes.forbidden,
    message: error instanceof Error ? error.message : PLANNED_MODE_REASON,
  });
  return true;
}

router.get("/customers-partners/tier-assignments", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    await ensureTierAssignmentSchema();

    return successResponse(res, {
      data: await buildAssignmentPreview(businessContext.businessId),
    });
  } catch (error) {
    if (handlePlannedError(res, error)) return;
    return handleApiError(res, error);
  }
});

router.post("/customers-partners/assign-tiers", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    await ensureTierAssignmentSchema();

    return successResponse(res, {
      data: await commitAssignments(businessContext.businessId),
      message: "Customer loyalty tiers assigned.",
    });
  } catch (error) {
    if (handlePlannedError(res, error)) return;
    return handleApiError(res, error);
  }
});

export default router;
