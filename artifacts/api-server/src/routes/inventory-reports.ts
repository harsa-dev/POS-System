import { InventoryType, Prisma } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { createBusinessScopeWhere, requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";
import { getInventoryStockStatus, toInventoryItemDto } from "../services/inventory/inventory.dto.js";

const router = Router();
const DEFAULT_LIMIT = 500;
const EXPORT_LIMIT = 5_000;

const inventoryTypeValues = new Set<string>(Object.values(InventoryType));

type InventoryReportStatus = "ALL" | "LOW_STOCK" | "OUT_OF_STOCK" | "IN_STOCK";
type InventoryReportSort = "HIGHEST_VALUE" | "LOWEST_STOCK" | "ITEM_NAME" | "NEWEST";

type InventoryReportRow = ReturnType<typeof toInventoryItemDto>;

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

function parseType(value: unknown): InventoryType | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase().replace(/[\s-]/g, "_");
  return inventoryTypeValues.has(normalized) ? (normalized as InventoryType) : undefined;
}

function parseStatus(value: unknown): InventoryReportStatus {
  if (typeof value !== "string") return "ALL";
  const normalized = value.trim().toUpperCase().replace(/[\s-]/g, "_");

  if (normalized === "LOW_STOCK") return "LOW_STOCK";
  if (normalized === "OUT_OF_STOCK") return "OUT_OF_STOCK";
  if (normalized === "IN_STOCK") return "IN_STOCK";

  return "ALL";
}

function parseLowStock(value: unknown) {
  if (typeof value !== "string") return false;
  return value.trim().toLowerCase() === "true";
}

function parseSort(value: unknown): InventoryReportSort {
  if (typeof value !== "string") return "HIGHEST_VALUE";
  const normalized = value.trim().toUpperCase().replace(/[\s-]/g, "_");

  if (normalized === "LOWEST_STOCK") return "LOWEST_STOCK";
  if (normalized === "ITEM_NAME") return "ITEM_NAME";
  if (normalized === "NEWEST") return "NEWEST";

  return "HIGHEST_VALUE";
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
    type: parseType(req.query.type),
    status: parseStatus(req.query.status),
    lowStock: parseLowStock(req.query.lowStock),
    sort: parseSort(req.query.sort),
    limit: parseLimit(req.query.limit),
  };
}

function rowMatchesStatus(row: InventoryReportRow, status: InventoryReportStatus, lowStockOnly: boolean) {
  if (lowStockOnly) return row.isLowStock || row.isOutOfStock;
  if (status === "ALL") return true;
  return row.stockStatus === status;
}

function sortRows(rows: InventoryReportRow[], sort: InventoryReportSort) {
  if (sort === "LOWEST_STOCK") return [...rows].sort((a, b) => a.currentStock - b.currentStock);
  if (sort === "ITEM_NAME") return [...rows].sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "NEWEST") return [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return [...rows].sort((a, b) => b.stockValue - a.stockValue);
}

function summarizeRows(rows: InventoryReportRow[]) {
  return {
    totalItems: rows.length,
    lowStockItems: rows.filter((row) => row.isLowStock).length,
    outOfStockItems: rows.filter((row) => row.isOutOfStock).length,
    inStockItems: rows.filter((row) => row.stockStatus === "IN_STOCK").length,
    totalStockValue: rows.reduce((total, row) => total + row.stockValue, 0),
    totalUnits: rows.reduce((total, row) => total + row.currentStock, 0),
    averageCostPerUnit:
      rows.length > 0
        ? Math.round(rows.reduce((total, row) => total + row.costPerUnit, 0) / rows.length)
        : 0,
  };
}

function rowsToCsv(rows: InventoryReportRow[]) {
  const header = [
    "Item ID",
    "Name",
    "SKU",
    "Type",
    "Unit",
    "Current Stock",
    "Minimum Stock",
    "Stock Status",
    "Cost Per Unit",
    "Stock Value",
    "Recipe Count",
    "Movement Count",
    "Updated At",
  ];

  const csvRows = rows.map((row) => [
    row.id,
    row.name,
    row.sku ?? "",
    row.type,
    row.unit,
    row.currentStock,
    row.minimumStock,
    row.stockStatus,
    row.costPerUnit,
    row.stockValue,
    row.recipeCount,
    row.movementCount,
    row.updatedAt,
  ]);

  return [header, ...csvRows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

async function listInventoryReportRows(params: {
  businessContext: Awaited<ReturnType<typeof requireBusinessContextForUser>>;
  search?: string;
  type?: InventoryType;
  status: InventoryReportStatus;
  lowStock: boolean;
  sort: InventoryReportSort;
  limit: number;
}) {
  const where: Prisma.InventoryItemWhereInput = {
    ...createBusinessScopeWhere(params.businessContext),
  };

  if (params.type) where.type = params.type;

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { sku: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const items = await prisma.inventoryItem.findMany({
    where,
    include: {
      _count: {
        select: {
          recipes: true,
          movements: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: EXPORT_LIMIT,
  });

  const rows = items
    .map((item) => toInventoryItemDto(item))
    .filter((row) => rowMatchesStatus(row, params.status, params.lowStock));

  return sortRows(rows, params.sort).slice(0, params.limit);
}

router.get("/inventory-reports", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const query = getReportQuery(req);
    const rows = await listInventoryReportRows({
      businessContext,
      ...query,
    });

    return successResponse(res, {
      data: {
        generatedAt: new Date().toISOString(),
        filters: {
          search: query.search ?? null,
          type: query.type ?? null,
          status: query.status,
          lowStock: query.lowStock,
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

router.get("/inventory-reports/export", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const format = parseFormat(req.query.format);
    if (format !== "csv" && format !== "json") {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Inventory report export format must be csv or json.",
      });
    }

    const query = getReportQuery(req);
    const rows = await listInventoryReportRows({
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
              type: query.type ?? null,
              status: query.status,
              lowStock: query.lowStock,
              sort: query.sort,
            },
          },
        },
      });
    }

    const csv = rowsToCsv(rows);
    const filename = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
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
