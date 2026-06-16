import type { Role } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForRequest } from "../lib/business-context/index.js";
import { ALL_ROLES } from "../lib/constants.js";
import { AppError } from "../lib/errors/app-error.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { successResponse } from "../lib/responses/success-response.js";
import { requireInventoryAdjust, requireInventoryView } from "../services/inventory/index.js";

const router = Router();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 250;

type RepairStatus = "REPAIRABLE" | "NEEDS_ITEM_COST";

type CostSnapshotRepairRow = {
  movementId: string;
  createdAt: Date;
  inventoryItemId: string | null;
  itemName: string | null;
  quantity: number | string | bigint | null;
  sourceType: string | null;
  sourceId: string | null;
  reason: string | null;
  currentSnapshot: number | string | bigint | null;
  itemCost: number | string | bigint | null;
  estimatedCost: number | string | bigint | null;
  repairStatus: RepairStatus;
};

function getActor(user: { id: string; role: Role }) {
  return {
    id: user.id,
    role: user.role,
  };
}

function toNumber(value: number | string | bigint | null | undefined) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function parseDate(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `${field} must be a valid date.`,
      details: { field, value },
    });
  }

  return date;
}

function parseLimit(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return DEFAULT_LIMIT;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;

  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

function buildPeriodFilter(from?: Date, to?: Date) {
  if (from && to) {
    return Prisma.sql`AND sm."createdAt" >= ${from} AND sm."createdAt" <= ${to}`;
  }

  if (from) return Prisma.sql`AND sm."createdAt" >= ${from}`;
  if (to) return Prisma.sql`AND sm."createdAt" <= ${to}`;

  return Prisma.empty;
}

function buildIdFilter(movementIds?: string[]) {
  if (!movementIds || movementIds.length === 0) return Prisma.empty;

  return Prisma.sql`AND sm."id" IN (${Prisma.join(movementIds)})`;
}

function normalizeMovementIds(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  const ids = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return ids.length > 0 ? Array.from(new Set(ids)).slice(0, MAX_LIMIT) : undefined;
}

function toRepairDto(row: CostSnapshotRepairRow) {
  const quantity = toNumber(row.quantity);
  const itemCost = toNumber(row.itemCost);

  return {
    movementId: row.movementId,
    createdAt: row.createdAt.toISOString(),
    inventoryItemId: row.inventoryItemId,
    itemName: row.itemName ?? "Unknown item",
    quantity,
    sourceType: row.sourceType ?? "STOCK_MOVEMENT",
    sourceId: row.sourceId,
    reason: row.reason ?? "OUT",
    currentSnapshot: toNumber(row.currentSnapshot),
    itemCost,
    estimatedCost: toNumber(row.estimatedCost),
    repairStatus: row.repairStatus,
  };
}

async function listMissingCostSnapshots(params: {
  businessId: string;
  from?: Date;
  to?: Date;
  movementIds?: string[];
  repairableOnly?: boolean;
  limit?: number;
}) {
  const periodFilter = buildPeriodFilter(params.from, params.to);
  const idFilter = buildIdFilter(params.movementIds);
  const repairableFilter = params.repairableOnly
    ? Prisma.sql`AND false`
    : Prisma.empty;
  const limit = params.limit ?? DEFAULT_LIMIT;

  const rows = await prisma.$queryRaw<CostSnapshotRepairRow[]>`
    SELECT
      sm."id" AS "movementId",
      sm."createdAt" AS "createdAt",
      sm."inventoryItemId" AS "inventoryItemId",
      ii."name" AS "itemName",
      sm."quantity" AS "quantity",
      sm."sourceType"::text AS "sourceType",
      sm."sourceId" AS "sourceId",
      sm."reason"::text AS "reason",
      NULL::integer AS "currentSnapshot",
      ii."costPerUnit" AS "itemCost",
      ROUND(ABS(sm."quantity") * COALESCE(ii."costPerUnit", 0)) AS "estimatedCost",
      'NEEDS_ITEM_COST' AS "repairStatus"
    FROM "StockMovement" sm
    LEFT JOIN "InventoryItem" ii ON ii."id" = sm."inventoryItemId"
    WHERE sm."businessId" = ${params.businessId}
      ${periodFilter}
      ${idFilter}
      ${repairableFilter}
      AND sm."type" = 'OUT'
      AND (
        sm."reason"::text = 'RECIPE_USAGE'
        OR sm."sourceType"::text IN ('ORDER', 'RECIPE')
      )
      AND (ii."id" IS NULL OR ii."costPerUnit" <= 0)
    ORDER BY sm."createdAt" DESC
    LIMIT ${limit};
  `;

  return rows.map(toRepairDto);
}

function summarizeRepairRows(rows: ReturnType<typeof toRepairDto>[]) {
  const repairableRows = rows.filter((row) => row.repairStatus === "REPAIRABLE");
  const needsItemCostRows = rows.filter((row) => row.repairStatus === "NEEDS_ITEM_COST");

  return {
    totalRows: rows.length,
    repairableRows: repairableRows.length,
    needsItemCostRows: needsItemCostRows.length,
    estimatedRepairValue: repairableRows.reduce((sum, row) => sum + row.estimatedCost, 0),
  };
}

router.get("/inventory-cost-snapshot-repairs", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    requireInventoryView(getActor(user));

    const businessContext = await requireBusinessContextForRequest(req, user);
    const from = parseDate(req.query.from, "from");
    const to = parseDate(req.query.to, "to");
    const limit = parseLimit(req.query.limit);
    const rows = await listMissingCostSnapshots({
      businessId: businessContext.businessId,
      from,
      to,
      limit,
    });

    return successResponse(res, {
      data: {
        generatedAt: new Date().toISOString(),
        period: {
          from: from?.toISOString() ?? null,
          to: to?.toISOString() ?? null,
        },
        limit,
        summary: summarizeRepairRows(rows),
        rows,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.post("/inventory-cost-snapshot-repairs/backfill", async (req, res) => {
  try {
    const user = await requireRole(req, res, ALL_ROLES);
    if (!user) return;

    requireInventoryAdjust(getActor(user));

    const businessContext = await requireBusinessContextForRequest(req, user);
    const from = parseDate(req.body?.from, "from");
    const to = parseDate(req.body?.to, "to");
    const movementIds = normalizeMovementIds(req.body?.movementIds);
    const limit = parseLimit(req.body?.limit);

    const candidates = await listMissingCostSnapshots({
      businessId: businessContext.businessId,
      from,
      to,
      movementIds,
      repairableOnly: true,
      limit,
    });

    return successResponse(res, {
      data: {
        repairedCount: 0,
        repairedValue: 0,
        repairedMovementIds: [],
        skippedMovementIds: candidates.map((row) => row.movementId),
      },
      message: "No cost snapshot column exists in the current V3 schema; update inventory item costs instead.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
