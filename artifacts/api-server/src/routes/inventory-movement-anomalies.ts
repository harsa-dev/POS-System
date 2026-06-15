import type {
  Prisma,
  StockMovementReason,
  StockMovementSource,
} from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { createBusinessScopeWhere, requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import {
  STOCK_MOVEMENT_REASONS,
  STOCK_MOVEMENT_SOURCES,
} from "../services/inventory/inventory.constants.js";

const router = Router();
const DEFAULT_LIMIT = 500;
const EXPORT_LIMIT = 5_000;
const DEFAULT_HIGH_VALUE_THRESHOLD = 1_000_000;
const DEFAULT_ADJUSTMENT_THRESHOLD = 50;

const stockMovementReasonValues = new Set<string>(STOCK_MOVEMENT_REASONS);
const stockMovementSourceValues = new Set<string>(STOCK_MOVEMENT_SOURCES);

const anomalyTypes = [
  "NEGATIVE_STOCK",
  "MISSING_COST_SNAPSHOT",
  "SUSPICIOUS_ADJUSTMENT",
  "HIGH_VALUE_MOVEMENT",
] as const;
const severityValues = ["INFO", "WARNING", "CRITICAL"] as const;

type InventoryMovementAnomalyType = (typeof anomalyTypes)[number];
type InventoryMovementAnomalySeverity = (typeof severityValues)[number];
type StockMovementWithItem = Prisma.StockMovementGetPayload<{ include: { inventoryItem: true } }>;
type InventoryMovementAnomalyRow = ReturnType<typeof toAnomalyRow>;

function normalizeEnum(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]/g, "_");
}

function parseAnomalyType(value: unknown): InventoryMovementAnomalyType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = normalizeEnum(value);
  return anomalyTypes.includes(normalized as InventoryMovementAnomalyType)
    ? (normalized as InventoryMovementAnomalyType)
    : undefined;
}

function parseSeverity(value: unknown): InventoryMovementAnomalySeverity | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = normalizeEnum(value);
  return severityValues.includes(normalized as InventoryMovementAnomalySeverity)
    ? (normalized as InventoryMovementAnomalySeverity)
    : undefined;
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

function parseNumber(value: unknown, fallback: number) {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

function parseLimit(value: unknown, fallback = DEFAULT_LIMIT) {
  const parsed = parseNumber(value, fallback);
  if (parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), EXPORT_LIMIT);
}

function parseFormat(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) return "csv";
  return value.trim().toLowerCase();
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function getAnomalyQuery(req: { query: Record<string, unknown> }) {
  return {
    search: typeof req.query.search === "string" ? req.query.search.trim() : undefined,
    inventoryItemId: typeof req.query.inventoryItemId === "string" ? req.query.inventoryItemId.trim() : undefined,
    anomalyType: parseAnomalyType(req.query.anomalyType),
    severity: parseSeverity(req.query.severity),
    reason: parseMovementReason(req.query.reason),
    sourceType: parseMovementSource(req.query.sourceType),
    sourceId: typeof req.query.sourceId === "string" ? req.query.sourceId.trim() : undefined,
    from: parseDate(req.query.from),
    to: parseDate(req.query.to),
    highValueThreshold: parseNumber(req.query.highValueThreshold, DEFAULT_HIGH_VALUE_THRESHOLD),
    adjustmentThreshold: parseNumber(req.query.adjustmentThreshold, DEFAULT_ADJUSTMENT_THRESHOLD),
    limit: parseLimit(req.query.limit),
  };
}

function movementUnitCost(movement: StockMovementWithItem) {
  return movement.unitCostSnapshot ?? movement.inventoryItem.costPerUnit ?? 0;
}

function movementValue(movement: StockMovementWithItem) {
  return Math.round(movementUnitCost(movement) * movement.quantity);
}

function isMissingCostSnapshot(movement: StockMovementWithItem) {
  return movement.type === "OUT" && (!movement.unitCostSnapshot || movement.unitCostSnapshot <= 0);
}

function isSuspiciousAdjustment(movement: StockMovementWithItem, adjustmentThreshold: number) {
  if (movement.type !== "ADJUSTMENT") return false;
  const reason = movement.reason;
  const suspiciousReason =
    reason === "MANUAL_ADJUSTMENT" || reason === "CORRECTION" || reason === "STOCK_COUNT";
  const stockDelta =
    movement.previousStock !== null && movement.newStock !== null
      ? Math.abs(movement.newStock - movement.previousStock)
      : Math.abs(movement.quantity);

  return suspiciousReason && Math.max(Math.abs(movement.quantity), stockDelta) >= adjustmentThreshold;
}

function anomalyDefinitions(movement: StockMovementWithItem, thresholds: {
  adjustmentThreshold: number;
  highValueThreshold: number;
}) {
  const definitions: Array<{
    type: InventoryMovementAnomalyType;
    severity: InventoryMovementAnomalySeverity;
    title: string;
    description: string;
    recommendedAction: string;
  }> = [];

  if ((movement.newStock ?? 0) < 0 || (movement.previousStock ?? 0) < 0) {
    definitions.push({
      type: "NEGATIVE_STOCK",
      severity: (movement.newStock ?? 0) < 0 ? "CRITICAL" : "WARNING",
      title: "Negative stock transition",
      description: `Stock moved from ${movement.previousStock ?? "unknown"} to ${movement.newStock ?? "unknown"}.`,
      recommendedAction: "Review the source transaction and add a correction or stock count movement if the snapshot is wrong.",
    });
  }

  if (isMissingCostSnapshot(movement)) {
    const hasFallbackCost = (movement.inventoryItem.costPerUnit ?? 0) > 0;
    definitions.push({
      type: "MISSING_COST_SNAPSHOT",
      severity: hasFallbackCost ? "WARNING" : "CRITICAL",
      title: "Missing unit cost snapshot",
      description: hasFallbackCost
        ? "COGS movement has no historical unit cost snapshot but current item cost can be used as a repair fallback."
        : "COGS movement has no unit cost snapshot and the item currently has no usable cost per unit.",
      recommendedAction: hasFallbackCost
        ? "Open the cost snapshot repair panel and backfill repairable movements."
        : "Set the item cost first, then rerun cost snapshot repair.",
    });
  }

  if (isSuspiciousAdjustment(movement, thresholds.adjustmentThreshold)) {
    definitions.push({
      type: "SUSPICIOUS_ADJUSTMENT",
      severity: "WARNING",
      title: "Suspicious stock adjustment",
      description: `Adjustment quantity or stock delta meets the threshold of ${thresholds.adjustmentThreshold} units.`,
      recommendedAction: "Confirm the adjustment source, physical stock count, and actor note before trusting inventory valuation.",
    });
  }

  const value = movementValue(movement);
  if (value >= thresholds.highValueThreshold) {
    definitions.push({
      type: "HIGH_VALUE_MOVEMENT",
      severity: value >= thresholds.highValueThreshold * 3 ? "CRITICAL" : "WARNING",
      title: "High-value stock movement",
      description: `Movement value ${value} meets the high-value threshold of ${thresholds.highValueThreshold}.`,
      recommendedAction: "Verify source document, item cost, and stock snapshot before closing inventory review.",
    });
  }

  return definitions;
}

function toAnomalyRow(
  movement: StockMovementWithItem,
  definition: ReturnType<typeof anomalyDefinitions>[number],
) {
  const value = movementValue(movement);

  return {
    id: `${movement.id}:${definition.type}`,
    anomalyType: definition.type,
    severity: definition.severity,
    title: definition.title,
    description: definition.description,
    recommendedAction: definition.recommendedAction,
    movementId: movement.id,
    businessId: movement.businessId ?? null,
    restaurantId: movement.restaurantId ?? null,
    actorId: movement.actorId ?? null,
    inventoryItemId: movement.inventoryItemId,
    itemName: movement.inventoryItem.name,
    itemSku: movement.inventoryItem.sku ?? null,
    itemType: movement.inventoryItem.type,
    itemUnit: movement.inventoryItem.unit,
    movementType: movement.type,
    quantity: movement.quantity,
    reason: movement.reason ?? null,
    sourceType: movement.sourceType ?? null,
    sourceId: movement.sourceId ?? null,
    note: movement.note ?? null,
    previousStock: movement.previousStock ?? null,
    newStock: movement.newStock ?? null,
    unitCostSnapshot: movement.unitCostSnapshot ?? null,
    fallbackCostPerUnit: movement.inventoryItem.costPerUnit,
    movementValue: value,
    createdAt: movement.createdAt.toISOString(),
  };
}

function summarizeAnomalies(rows: InventoryMovementAnomalyRow[]) {
  return {
    totalAnomalies: rows.length,
    criticalCount: rows.filter((row) => row.severity === "CRITICAL").length,
    warningCount: rows.filter((row) => row.severity === "WARNING").length,
    infoCount: rows.filter((row) => row.severity === "INFO").length,
    negativeStockCount: rows.filter((row) => row.anomalyType === "NEGATIVE_STOCK").length,
    missingCostSnapshotCount: rows.filter((row) => row.anomalyType === "MISSING_COST_SNAPSHOT").length,
    suspiciousAdjustmentCount: rows.filter((row) => row.anomalyType === "SUSPICIOUS_ADJUSTMENT").length,
    highValueMovementCount: rows.filter((row) => row.anomalyType === "HIGH_VALUE_MOVEMENT").length,
    totalValueAtRisk: rows.reduce((total, row) => total + row.movementValue, 0),
  };
}

function rowsToCsv(rows: InventoryMovementAnomalyRow[]) {
  const header = [
    "Anomaly Type",
    "Severity",
    "Title",
    "Movement ID",
    "Created At",
    "Item",
    "SKU",
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
    "Recommended Action",
    "Note",
  ];

  const csvRows = rows.map((row) => [
    row.anomalyType,
    row.severity,
    row.title,
    row.movementId,
    row.createdAt,
    row.itemName,
    row.itemSku ?? "",
    row.movementType,
    row.quantity,
    row.reason ?? "",
    row.sourceType ?? "",
    row.sourceId ?? "",
    row.previousStock ?? "",
    row.newStock ?? "",
    row.unitCostSnapshot ?? "",
    row.fallbackCostPerUnit,
    row.movementValue,
    row.recommendedAction,
    row.note ?? "",
  ]);

  return [header, ...csvRows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

async function listInventoryMovementAnomalies(params: {
  businessContext: Awaited<ReturnType<typeof requireBusinessContextForUser>>;
  search?: string;
  inventoryItemId?: string;
  anomalyType?: InventoryMovementAnomalyType;
  severity?: InventoryMovementAnomalySeverity;
  reason?: StockMovementReason;
  sourceType?: StockMovementSource;
  sourceId?: string;
  from?: Date;
  to?: Date;
  highValueThreshold: number;
  adjustmentThreshold: number;
  limit: number;
}) {
  const where: Prisma.StockMovementWhereInput = {
    inventoryItem: createBusinessScopeWhere(params.businessContext),
  };

  if (params.inventoryItemId) where.inventoryItemId = params.inventoryItemId;
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
    orderBy: { createdAt: "desc" },
    take: EXPORT_LIMIT,
  });

  const rows = movements.flatMap((movement) =>
    anomalyDefinitions(movement, {
      adjustmentThreshold: params.adjustmentThreshold,
      highValueThreshold: params.highValueThreshold,
    }).map((definition) => toAnomalyRow(movement, definition)),
  );

  return rows
    .filter((row) => (params.anomalyType ? row.anomalyType === params.anomalyType : true))
    .filter((row) => (params.severity ? row.severity === params.severity : true))
    .slice(0, params.limit);
}

router.get("/inventory-movement-anomalies", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const query = getAnomalyQuery(req);
    const rows = await listInventoryMovementAnomalies({
      businessContext,
      ...query,
    });

    return successResponse(res, {
      data: {
        generatedAt: new Date().toISOString(),
        filters: {
          search: query.search ?? null,
          inventoryItemId: query.inventoryItemId ?? null,
          anomalyType: query.anomalyType ?? null,
          severity: query.severity ?? null,
          reason: query.reason ?? null,
          sourceType: query.sourceType ?? null,
          sourceId: query.sourceId ?? null,
          from: query.from?.toISOString() ?? null,
          to: query.to?.toISOString() ?? null,
          highValueThreshold: query.highValueThreshold,
          adjustmentThreshold: query.adjustmentThreshold,
          limit: query.limit,
        },
        summary: summarizeAnomalies(rows),
        rows,
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/inventory-movement-anomalies/export", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const query = getAnomalyQuery(req);
    const format = parseFormat(req.query.format);
    const rows = await listInventoryMovementAnomalies({
      businessContext,
      ...query,
      limit: EXPORT_LIMIT,
    });

    if (format === "json") {
      return successResponse(res, {
        data: {
          rows,
          meta: {
            exportedAt: new Date().toISOString(),
            rowCount: rows.length,
            filters: {
              search: query.search ?? null,
              inventoryItemId: query.inventoryItemId ?? null,
              anomalyType: query.anomalyType ?? null,
              severity: query.severity ?? null,
              reason: query.reason ?? null,
              sourceType: query.sourceType ?? null,
              sourceId: query.sourceId ?? null,
              from: query.from?.toISOString() ?? null,
              to: query.to?.toISOString() ?? null,
              highValueThreshold: query.highValueThreshold,
              adjustmentThreshold: query.adjustmentThreshold,
            },
          },
        },
      });
    }

    if (format !== "csv") {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Unsupported export format. Use csv or json.",
      });
    }

    const csv = rowsToCsv(rows);
    const exportedAt = new Date().toISOString();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="inventory-movement-anomalies-${exportedAt.slice(0, 10)}.csv"`,
    );
    res.setHeader("X-Row-Count", String(rows.length));
    res.setHeader("X-Exported-At", exportedAt);

    return res.send(csv);
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
