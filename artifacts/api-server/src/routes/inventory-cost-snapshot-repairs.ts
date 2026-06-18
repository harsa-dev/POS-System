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

/**
 * REPAIRABLE: unitCostSnapshot IS NULL but the item has a usable costPerUnit.
 *   The backfill can write the current item cost into the snapshot field.
 *
 * NEEDS_ITEM_COST: unitCostSnapshot IS NULL and the item has no usable cost.
 *   The user must set the item cost first, then rerun the repair.
 */
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

/**
 * Lists StockMovement records where unitCostSnapshot IS NULL and the movement
 * was used for COGS (reason = RECIPE_USAGE or source = ORDER/RECIPE).
 *
 * Classifies each row:
 *   REPAIRABLE       — item has costPerUnit > 0; backfill can write the snapshot.
 *   NEEDS_ITEM_COST  — item has no usable cost; user must set it first.
 *
 * When repairableOnly = true, only REPAIRABLE rows are returned (used by the
 * backfill endpoint to find candidates it can actually fix).
 */
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
  // When repairableOnly, restrict to rows the backfill can repair (item has cost).
  const repairableFilter = params.repairableOnly
    ? Prisma.sql`AND ii."costPerUnit" > 0`
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
      sm."unitCostSnapshot"::double precision AS "currentSnapshot",
      COALESCE(ii."costPerUnit", 0) AS "itemCost",
      ROUND(ABS(sm."quantity") * COALESCE(ii."costPerUnit", 0)) AS "estimatedCost",
      CASE
        WHEN COALESCE(ii."costPerUnit", 0) > 0 THEN 'REPAIRABLE'
        ELSE 'NEEDS_ITEM_COST'
      END AS "repairStatus"
    FROM "StockMovement" sm
    LEFT JOIN "InventoryItem" ii ON ii."id" = sm."inventoryItemId"
    WHERE sm."businessId" = ${params.businessId}
      AND sm."unitCostSnapshot" IS NULL
      ${periodFilter}
      ${idFilter}
      ${repairableFilter}
      AND sm."type" = 'OUT'
      AND (
        sm."reason"::text = 'RECIPE_USAGE'
        OR sm."sourceType"::text IN ('ORDER', 'RECIPE')
      )
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

/**
 * Backfill: write unitCostSnapshot and totalCostSnapshot for REPAIRABLE movements.
 *
 * For each candidate movement where unitCostSnapshot IS NULL and the linked
 * InventoryItem has costPerUnit > 0, sets:
 *   unitCostSnapshot  = ii.costPerUnit          (current item cost as repair value)
 *   totalCostSnapshot = ABS(quantity) * ii.costPerUnit
 *
 * This is a best-effort historical repair using the current item cost as a
 * proxy. It is not a perfect historical cost but is better than NULL for
 * COGS reporting. The UI labels this as "repaired from item cost".
 *
 * Movements where the item has no cost are skipped and returned as
 * skippedMovementIds. The user must set the item cost first, then rerun.
 */
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

    const repairableIds = candidates
      .filter((row) => row.repairStatus === "REPAIRABLE")
      .map((row) => row.movementId);

    const skippedIds = candidates
      .filter((row) => row.repairStatus === "NEEDS_ITEM_COST")
      .map((row) => row.movementId);

    let repairedCount = 0;
    let repairedValue = 0;

    if (repairableIds.length > 0) {
      // Write unitCostSnapshot and totalCostSnapshot for each repairable movement.
      // We use a raw UPDATE joining InventoryItem to capture the cost at repair time.
      const updateResult = await prisma.$executeRaw`
        UPDATE "StockMovement" sm
        SET
          "unitCostSnapshot"  = ii."costPerUnit"::numeric,
          "totalCostSnapshot" = ROUND(ABS(sm."quantity") * ii."costPerUnit"::numeric)
        FROM "InventoryItem" ii
        WHERE sm."inventoryItemId" = ii."id"
          AND sm."id" IN (${Prisma.join(repairableIds)})
          AND sm."businessId" = ${businessContext.businessId}
          AND sm."unitCostSnapshot" IS NULL
          AND ii."costPerUnit" > 0
      `;

      repairedCount = updateResult;

      // Sum the estimated repair value from the candidate list (already calculated).
      repairedValue = candidates
        .filter((row) => row.repairStatus === "REPAIRABLE")
        .reduce((sum, row) => sum + row.estimatedCost, 0);
    }

    return successResponse(res, {
      data: {
        repairedCount,
        repairedValue,
        repairedMovementIds: repairableIds.slice(0, repairedCount),
        skippedMovementIds: skippedIds,
      },
      message:
        repairedCount > 0
          ? `${repairedCount} movement(s) repaired with current item cost as snapshot. COGS reports will reflect the restored values.`
          : "No movements were repaired. Ensure inventory items have cost set above zero, then retry.",
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
