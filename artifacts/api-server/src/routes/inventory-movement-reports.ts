import {
  Prisma,
  type StockMovementReason,
  type StockMovementSource,
  type StockMovementType,
} from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { createBusinessScopeWhere, requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  STOCK_MOVEMENT_REASONS,
  STOCK_MOVEMENT_SOURCES,
  STOCK_MOVEMENT_TYPES,
} from "../services/inventory/inventory.constants.js";

const router = Router();
const DEFAULT_LIMIT = 500;
const EXPORT_LIMIT = 5_000;

const stockMovementTypeValues = new Set<string>(STOCK_MOVEMENT_TYPES);
const stockMovementReasonValues = new Set<string>(STOCK_MOVEMENT_REASONS);
const stockMovementSourceValues = new Set<string>(STOCK_MOVEMENT_SOURCES);

type InventoryMovementReportSort = "NEWEST" | "OLDEST" | "HIGHEST_QUANTITY" | "HIGHEST_VALUE";

// StockMovement now includes previousStock, newStock, unitCostSnapshot, and
// totalCostSnapshot directly from the Prisma schema. No manual intersection needed.
type StockMovementWithItem = Prisma.StockMovementGetPayload<{ include: { inventoryItem: true } }>;
type InventoryMovementReportRow = ReturnType<typeof toMovementReportRow>;

function parseFormat(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) return "csv";
  return value.trim().toLowerCase();
}

function parseLimit(value: unknown, fallback = DEFAULT_LIMIT) {
  if (typeof value !== "string" && typeof value !== "number") return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

  return Math.min(Math.floor(parsed), EXPORT_LIMIT);
}

function normalizeEnum(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]/g, "_");
}

function parseMovementType(value: unknown): StockMovementType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = normalizeEnum(value);
  return stockMovementTypeValues.has(normalized) ? (normalized as StockMovementType) : undefined;
}

function parseMovementReason(value: unknown): StockMovementReason | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = normalizeEnum(value);
  return stockMovementReasonValues.has(normalized) ? (normalized as StockMovementReason) : undefined;
}

function parseMovementSource(value: unknown): StockMovementSource | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = normalizeEnum(value);
  return stockMovementSourceValues.has(normalized) ? (normalized as StockMovementSource) : undefined;
}

function parseDate(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parseSort(value: unknown): InventoryMovementReportSort {
  if (typeof value !== "string") return "NEWEST";
  const normalized = normalizeEnum(value);
  if (normalized === "OLDEST") return "OLDEST";
  if (normalized === "HIGHEST_QUANTITY") return "HIGHEST_QUANTITY";
  if (normalized === "HIGHEST_VALUE") return "HIGHEST_VALUE";
  return "NEWEST";
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function getReportQuery(req: { query: Record<string, unknown> }) {
  return {
    search: typeof req.query.search === "string" ? req.query.search.trim() : undefined,
    inventoryItemId: typeof req.query.inventoryItemId === "string" ? req.query.inventoryItemId.trim() : undefined,
    type: parseMovementType(req.query.type),
    reason: parseMovementReason(req.query.reason),
    sourceType: parseMovementSource(req.query.sourceType),
    sourceId: typeof req.query.sourceId === "string" ? req.query.sourceId.trim() : undefined,
    from: parseDate(req.query.from),
    to: parseDate(req.query.to),
    sort: parseSort(req.query.sort),
    limit: parseLimit(req.query.limit),
  };
}

function toMovementReportRow(movement: StockMovementWithItem) {
  // Prefer the persisted unitCostSnapshot (historical cost at movement time).
  // Fall back to the current item costPerUnit as an estimate when the snapshot
  // is absent — this is always labeled as a fallback in the DTO.
  const unitCostRaw = movement.unitCostSnapshot ?? null;
  const unitCost = unitCostRaw !== null
    ? Number(unitCostRaw)
    : (movement.inventoryItem.costPerUnit ?? 0);
  const movementValue = Math.round(unitCost * Math.abs(movement.quantity));

  return {
    id: movement.id,
    businessId: movement.businessId ?? null,
    restaurantId: movement.restaurantId ?? null,
    actorId: movement.actorId ?? null,
    inventoryItemId: movement.inventoryItemId,
    itemName: movement.inventoryItem.name,
    itemSku: movement.inventoryItem.sku ?? null,
    itemType: movement.inventoryItem.type,
    itemUnit: movement.inventoryItem.unit,
    type: movement.type,
    quantity: movement.quantity,
    reason: movement.reason ?? null,
    sourceType: movement.sourceType ?? null,
    sourceId: movement.sourceId ?? null,
    note: movement.note ?? null,
    previousStock: movement.previousStock ?? null,
    newStock: movement.newStock ?? null,
    unitCostSnapshot: unitCostRaw !== null ? Number(unitCostRaw) : null,
    fallbackCostPerUnit: movement.inventoryItem.costPerUnit,
    movementValue,
    createdAt: movement.createdAt.toISOString(),
  };
}

function summarizeRows(rows: InventoryMovementReportRow[]) {
  const inRows = rows.filter((row) => row.type === "IN");
  const outRows = rows.filter((row) => row.type === "OUT");
  const adjustmentRows = rows.filter((row) => row.type === "ADJUSTMENT");

  return {
    totalMovements: rows.length,
    inMovements: inRows.length,
    outMovements: outRows.length,
    adjustmentMovements: adjustmentRows.length,
    totalInQuantity: inRows.reduce((total, row) => total + row.quantity, 0),
    totalOutQuantity: outRows.reduce((total, row) => total + row.quantity, 0),
    totalAdjustmentQuantity: adjustmentRows.reduce((total, row) => total + row.quantity, 0),
    netQuantity:
      inRows.reduce((total, row) => total + row.quantity, 0) -
      outRows.reduce((total, row) => total + row.quantity, 0),
    totalMovementValue: rows.reduce((total, row) => total + row.movementValue, 0),
  };
}

function rowsToCsv(rows: InventoryMovementReportRow[]) {
  const header = [
    "Movement ID",
    "Created At",
    "Item",
    "SKU",
    "Item Type",
    "Unit",
    "Movement Type",
    "Quantity",
    "Reason",
    "Source Type",
    "Source ID",
    "Previous Stock",
    "New Stock",
    "Unit Cost Snapshot",
    "Fallback Cost Per Unit",
    "Movement Value",
    "Actor ID",
    "Note",
  ];

  const csvRows = rows.map((row) => [
    row.id,
    row.createdAt,
    row.itemName,
    row.itemSku ?? "",
    row.itemType,
    row.itemUnit,
    row.type,
    row.quantity,
    row.reason ?? "",
    row.sourceType ?? "",
    row.sourceId ?? "",
    row.previousStock ?? "",
    row.newStock ?? "",
    row.unitCostSnapshot ?? "",
    row.fallbackCostPerUnit,
    row.movementValue,
    row.actorId ?? "",
    row.note ?? "",
  ]);

  return [header, ...csvRows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function getOrderBy(sort: InventoryMovementReportSort): Prisma.StockMovementOrderByWithRelationInput {
  if (sort === "OLDEST") return { createdAt: "asc" };
  if (sort === "HIGHEST_QUANTITY") return { quantity: "desc" };
  return { createdAt: "desc" };
}

async function listInventoryMovementReportRows(params: {
  businessContext: Awaited<ReturnType<typeof requireBusinessContextForUser>>;
  search?: string;
  inventoryItemId?: string;
  type?: StockMovementType;
  reason?: StockMovementReason;
  sourceType?: StockMovementSource;
  sourceId?: string;
  from?: Date;
  to?: Date;
  sort: InventoryMovementReportSort;
  limit: number;
}) {
  const where: Prisma.StockMovementWhereInput = {
    inventoryItem: createBusinessScopeWhere(params.businessContext),
  };

  if (params.inventoryItemId) where.inventoryItemId = params.inventoryItemId;
  if (params.type) where.type = params.type;
  if (params.reason) where.reason = params.reason;
  if (params.sourceType) where.sourceType = params.sourceType;
  if (params.sourceId) where.sourceId = { contains: params.sourceId, mode: "insensitive" };

  if (params.from || params.to) {
    where.createdAt = {
      ...(params.from ? { gte: params.from } : {}),
      ...(params.to ? { lte: params.to } : {}),
    };
  }

  if (params.search) {
    where.OR = [
      { note: { contains: params.search, mode: "insensitive" } },
      { sourceId: { contains: params.search, mode: "insensitive" } },
      { inventoryItem: { name: { contains: params.search, mode: "insensitive" } } },
      { inventoryItem: { sku: { contains: params.search, mode: "insensitive" } } },
    ];
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: { inventoryItem: true },
    orderBy: getOrderBy(params.sort),
    take: params.sort === "HIGHEST_VALUE" ? EXPORT_LIMIT : params.limit,
  });

  const rows = movements.map(toMovementReportRow);
  if (params.sort === "HIGHEST_VALUE") {
    return rows.sort((a, b) => b.movementValue - a.movementValue).slice(0, params.limit);
  }

  return rows;
}

router.get("/inventory-movement-reports", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const query = getReportQuery(req);
    const rows = await listInventoryMovementReportRows({
      businessContext,
      ...query,
    });

    return successResponse(res, {
      data: {
        generatedAt: new Date().toISOString(),
        filters: {
          search: query.search ?? null,
          inventoryItemId: query.inventoryItemId ?? null,
          type: query.type ?? null,
          reason: query.reason ?? null,
          sourceType: query.sourceType ?? null,
          sourceId: query.sourceId ?? null,
          from: query.from?.toISOString() ?? null,
          to: query.to?.toISOString() ?? null,
          sort: query.sort,
          limit: query.limit,
        },
        summary: summarizeRows(rows),
        rows,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/inventory-movement-reports/export", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const format = parseFormat(req.query.format);
    if (format !== "csv" && format !== "json") {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Inventory movement report export format must be csv or json.",
      });
    }

    const query = getReportQuery(req);
    const rows = await listInventoryMovementReportRows({
      businessContext,
      ...query,
      limit: EXPORT_LIMIT,
    });
    const exportedAt = new Date().toISOString();

    if (format === "json") {
      return successResponse(res, {
        data: {
          rows,
          meta: {
            exportedAt,
            rowCount: rows.length,
            limit: EXPORT_LIMIT,
            filters: {
              search: query.search ?? null,
              inventoryItemId: query.inventoryItemId ?? null,
              type: query.type ?? null,
              reason: query.reason ?? null,
              sourceType: query.sourceType ?? null,
              sourceId: query.sourceId ?? null,
              from: query.from?.toISOString() ?? null,
              to: query.to?.toISOString() ?? null,
              sort: query.sort,
            },
          },
        },
      });
    }

    const csv = rowsToCsv(rows);
    const filename = `inventory-movement-report-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    res.setHeader("X-Exported-At", exportedAt);
    res.setHeader("X-Row-Count", String(rows.length));
    return res.status(200).send(csv);
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
