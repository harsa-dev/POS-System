import type { Role } from "@prisma/client";
import { Router } from "express";
import { randomUUID } from "node:crypto";

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
  "Customers & Partners loyalty tiers are not operational for planned service/custom-business mode yet.";

const DEFAULT_TIERS = [
  { icon: "B", tierName: "Bronze", minimumSpending: 1_000_000, automaticDiscount: "2%", sortOrder: 1 },
  { icon: "S", tierName: "Silver", minimumSpending: 5_000_000, automaticDiscount: "5%", sortOrder: 2 },
  { icon: "G", tierName: "Gold", minimumSpending: 10_000_000, automaticDiscount: "8%", sortOrder: 3 },
  { icon: "P", tierName: "Platinum", minimumSpending: 20_000_000, automaticDiscount: "12%", sortOrder: 4 },
] as const;

type LoyaltyTierRow = {
  id: string;
  businessId: string;
  icon: string;
  tierName: "Bronze" | "Silver" | "Gold" | "Platinum";
  calculationPeriod: string;
  minimumSpending: number;
  automaticDiscount: string;
  sortOrder: number;
};

type LoyaltyTierInput = {
  icon: string;
  calculationPeriod: string;
  minimumSpending: number;
  automaticDiscount: string;
  sortOrder: number;
};

class LoyaltyTierInputError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "LoyaltyTierInputError";
    this.status = status;
  }
}

function isPlannedMode(businessMode: string) {
  return businessMode === "custom-business";
}

function canManage(role: Role) {
  return MANAGEMENT_ROLES.includes(role);
}

function requireSupportedMode(mode: string) {
  if (isPlannedMode(mode)) {
    throw new LoyaltyTierInputError(PLANNED_MODE_REASON, 403);
  }
}

function getText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseInteger(value: unknown, field: string) {
  const numberValue = typeof value === "number" ? value : Number.parseInt(getText(value), 10);
  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new LoyaltyTierInputError(`${field} must be a non-negative integer.`);
  }
  return numberValue;
}

function parseDiscount(value: unknown) {
  const text = getText(value);
  const normalized = text.endsWith("%") ? text : `${text}%`;
  const numeric = Number.parseFloat(normalized.replace("%", ""));
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100) {
    throw new LoyaltyTierInputError("Automatic discount must be between 0% and 100%.");
  }
  return `${numeric}%`;
}

function parseTierInput(body: unknown): LoyaltyTierInput {
  if (typeof body !== "object" || body === null) {
    throw new LoyaltyTierInputError("Loyalty tier payload is required.");
  }

  const record = body as Record<string, unknown>;
  const icon = getText(record.icon).slice(0, 4).toUpperCase();
  const calculationPeriod = getText(record.calculationPeriod) || "Last 12 months";

  if (!icon) throw new LoyaltyTierInputError("Icon is required.");
  if (calculationPeriod.length > 60) {
    throw new LoyaltyTierInputError("Calculation period must be 60 characters or fewer.");
  }

  return {
    icon,
    calculationPeriod,
    minimumSpending: parseInteger(record.minimumSpending, "Minimum spending"),
    automaticDiscount: parseDiscount(record.automaticDiscount),
    sortOrder: parseInteger(record.sortOrder, "Sort order"),
  };
}

async function ensureLoyaltyTierSchema() {
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

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "SharedLoyaltyTierSetting_businessId_tierName_key"
    ON "SharedLoyaltyTierSetting"("businessId", "tierName");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "SharedLoyaltyTierSetting_businessId_idx"
    ON "SharedLoyaltyTierSetting"("businessId");
  `);
}

async function seedDefaultTiers(businessId: string) {
  const existing = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "SharedLoyaltyTierSetting"
    WHERE "businessId" = ${businessId}
  `;

  if (Number(existing[0]?.count ?? 0) > 0) return;

  for (const tier of DEFAULT_TIERS) {
    await prisma.$executeRaw`
      INSERT INTO "SharedLoyaltyTierSetting" (
        "id", "businessId", "icon", "tierName", "minimumSpending", "automaticDiscount", "sortOrder", "updatedAt"
      ) VALUES (
        ${randomUUID()}, ${businessId}, ${tier.icon}, ${tier.tierName}, ${tier.minimumSpending}, ${tier.automaticDiscount}, ${tier.sortOrder}, now()
      )
      ON CONFLICT ("businessId", "tierName") DO NOTHING
    `;
  }
}

async function listLoyaltyTiers(businessId: string) {
  return prisma.$queryRaw<LoyaltyTierRow[]>`
    SELECT "id", "businessId", "icon", "tierName", "calculationPeriod", "minimumSpending", "automaticDiscount", "sortOrder"
    FROM "SharedLoyaltyTierSetting"
    WHERE "businessId" = ${businessId}
    ORDER BY "sortOrder" ASC, "minimumSpending" ASC
  `;
}

async function updateLoyaltyTier(businessId: string, id: string, input: LoyaltyTierInput) {
  await prisma.$executeRaw`
    UPDATE "SharedLoyaltyTierSetting"
    SET
      "icon" = ${input.icon},
      "calculationPeriod" = ${input.calculationPeriod},
      "minimumSpending" = ${input.minimumSpending},
      "automaticDiscount" = ${input.automaticDiscount},
      "sortOrder" = ${input.sortOrder},
      "updatedAt" = now()
    WHERE "id" = ${id}
      AND "businessId" = ${businessId}
  `;

  const rows = await prisma.$queryRaw<LoyaltyTierRow[]>`
    SELECT "id", "businessId", "icon", "tierName", "calculationPeriod", "minimumSpending", "automaticDiscount", "sortOrder"
    FROM "SharedLoyaltyTierSetting"
    WHERE "id" = ${id}
      AND "businessId" = ${businessId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

function respondTierInputError(res: Parameters<typeof errorResponse>[0], error: LoyaltyTierInputError) {
  return errorResponse(res, {
    status: error.status,
    code: error.status === 403 ? errorCodes.forbidden : errorCodes.validationError,
    message: error.message,
  });
}

router.get("/customers-partners/loyalty-tiers", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    await ensureLoyaltyTierSchema();
    await seedDefaultTiers(businessContext.businessId);

    return successResponse(res, {
      data: {
        tiers: await listLoyaltyTiers(businessContext.businessId),
        canUpdate: canManage(user.role),
      },
    });
  } catch (error) {
    if (error instanceof LoyaltyTierInputError) return respondTierInputError(res, error);
    return handleApiError(res, error);
  }
});

router.patch("/customers-partners/loyalty-tiers/:id", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;
    const businessContext = await requireBusinessContextForUser(user);
    requireSupportedMode(businessContext.businessMode);
    await ensureLoyaltyTierSchema();
    await seedDefaultTiers(businessContext.businessId);

    const tier = await updateLoyaltyTier(
      businessContext.businessId,
      req.params.id,
      parseTierInput(req.body),
    );

    if (!tier) {
      return errorResponse(res, {
        status: 404,
        code: errorCodes.notFound,
        message: "Loyalty tier not found.",
      });
    }

    return successResponse(res, { data: tier, message: "Loyalty tier updated." });
  } catch (error) {
    if (error instanceof LoyaltyTierInputError) return respondTierInputError(res, error);
    return handleApiError(res, error);
  }
});

export default router;
