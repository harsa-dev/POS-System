import { Prisma } from "@prisma/client";
import { Router } from "express";

import { requireRole } from "../lib/auth.js";
import { requireBusinessContextForUser } from "../lib/business-context/index.js";
import { MANAGEMENT_ROLES } from "../lib/constants.js";
import { errorCodes } from "../lib/errors/error-codes.js";
import { handleApiError } from "../lib/errors/handle-api-error.js";
import { prisma } from "../lib/prisma.js";
import { errorResponse } from "../lib/responses/error-response.js";
import { successResponse } from "../lib/responses/success-response.js";

const router = Router();
const DEFAULT_LIMIT = 100;
const EXPORT_LIMIT = 5_000;

type RepairAuditRow = {
  auditId: string;
  businessId: string;
  restaurantId: string | null;
  userId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  entityType: string;
  movementId: string;
  action: string;
  createdAt: Date;
  inventoryItemId: string | null;
  itemName: string | null;
  unitCostSnapshot: string | number | null;
  estimatedCost: string | number | null;
  sourceType: string | null;
  sourceId: string | null;
};

function parseDate(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return date;
}

function parseLimit(value: unknown, fallback = DEFAULT_LIMIT) {
  if (typeof value !== "string" && typeof value !== "number") return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;

  return Math.min(Math.floor(parsed), EXPORT_LIMIT);
}

function parseFormat(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) return "csv";
  return value.trim().toLowerCase();
}

function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function buildPeriodFilter(from?: Date, to?: Date) {
  if (from && to) {
    return Prisma.sql`AND al."createdAt" >= ${from} AND al."createdAt" <= ${to}`;
  }

  if (from) return Prisma.sql`AND al."createdAt" >= ${from}`;
  if (to) return Prisma.sql`AND al."createdAt" <= ${to}`;

  return Prisma.empty;
}

function csvEscape(value: unknown) {
  if (value === null || value === undefined) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function mapRepairAuditRow(row: RepairAuditRow) {
  return {
    auditId: row.auditId,
    businessId: row.businessId,
    restaurantId: row.restaurantId,
    userId: row.userId,
    actorName: row.actorName ?? "Unknown actor",
    actorEmail: row.actorEmail,
    entityType: row.entityType,
    movementId: row.movementId,
    action: row.action,
    createdAt: row.createdAt.toISOString(),
    inventoryItemId: row.inventoryItemId,
    itemName: row.itemName ?? "Unknown item",
    unitCostSnapshot: toNumber(row.unitCostSnapshot),
    estimatedCost: toNumber(row.estimatedCost),
    sourceType: row.sourceType ?? "STOCK_MOVEMENT",
    sourceId: row.sourceId,
  };
}

function summarizeRepairAuditRows(rows: RepairAuditRow[]) {
  const mappedRows = rows.map(mapRepairAuditRow);
  const actorIds = new Set(mappedRows.map((row) => row.userId).filter(Boolean));
  const movementIds = new Set(mappedRows.map((row) => row.movementId).filter(Boolean));
  const latestRepairAt = rows.reduce<Date | null>((latest, row) => {
    if (!latest || row.createdAt > latest) return row.createdAt;
    return latest;
  }, null);

  return {
    totalAuditEvents: rows.length,
    repairedMovementCount: movementIds.size,
    repairedValue: mappedRows.reduce((sum, row) => sum + row.estimatedCost, 0),
    actorCount: actorIds.size,
    latestRepairAt: latestRepairAt?.toISOString() ?? null,
  };
}

function repairAuditRowsToCsv(rows: RepairAuditRow[]) {
  const header = [
    "Repair Time",
    "Audit ID",
    "Movement ID",
    "Item",
    "Unit Cost Snapshot",
    "Estimated COGS",
    "Source Type",
    "Source ID",
    "Actor",
    "Actor Email",
  ];

  const csvRows = rows.map((row) => {
    const mapped = mapRepairAuditRow(row);

    return [
      mapped.createdAt,
      mapped.auditId,
      mapped.movementId,
      mapped.itemName,
      mapped.unitCostSnapshot,
      mapped.estimatedCost,
      mapped.sourceType,
      mapped.sourceId,
      mapped.actorName,
      mapped.actorEmail,
    ];
  });

  return [header, ...csvRows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

async function listRepairAuditRows(params: {
  businessId: string;
  from?: Date;
  to?: Date;
  limit?: number;
}) {
  const periodFilter = buildPeriodFilter(params.from, params.to);
  const limit = params.limit ?? DEFAULT_LIMIT;

  return prisma.$queryRaw<RepairAuditRow[]>`
    SELECT
      al."id" AS "auditId",
      al."businessId" AS "businessId",
      al."restaurantId" AS "restaurantId",
      al."userId" AS "userId",
      u."name" AS "actorName",
      u."email" AS "actorEmail",
      al."entityType" AS "entityType",
      al."entityId" AS "movementId",
      al."action"::text AS "action",
      al."createdAt" AS "createdAt",
      al."changes"::jsonb->>'inventoryItemId' AS "inventoryItemId",
      al."changes"::jsonb->>'itemName' AS "itemName",
      al."changes"::jsonb->>'unitCostSnapshot' AS "unitCostSnapshot",
      al."changes"::jsonb->>'estimatedCost' AS "estimatedCost",
      al."changes"::jsonb->>'sourceType' AS "sourceType",
      al."changes"::jsonb->>'sourceId' AS "sourceId"
    FROM "AuditLog" al
    LEFT JOIN "User" u ON u."id" = al."userId"
    WHERE al."businessId" = ${params.businessId}
      ${periodFilter}
      AND al."entityType" = 'StockMovement'
      AND al."action"::text = 'UPDATE'
      AND al."changes"::jsonb->>'repairType' = 'BACKFILL_UNIT_COST_SNAPSHOT'
    ORDER BY al."createdAt" DESC
    LIMIT ${limit};
  `;
}

router.get("/financial-reports/repair-audit", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    const limit = parseLimit(req.query.limit);
    const rows = await listRepairAuditRows({
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
        summary: summarizeRepairAuditRows(rows),
        rows: rows.map(mapRepairAuditRow),
      },
    });
  } catch (error) {
    return handleApiError(res, error);
  }
});

router.get("/financial-reports/repair-audit/export", async (req, res) => {
  try {
    const user = await requireRole(req, res, MANAGEMENT_ROLES);
    if (!user) return;

    const businessContext = await requireBusinessContextForUser(user);
    const format = parseFormat(req.query.format);
    if (format !== "csv" && format !== "json") {
      return errorResponse(res, {
        status: 400,
        code: errorCodes.validationError,
        message: "Repair audit export format must be csv or json.",
      });
    }

    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);
    const rows = await listRepairAuditRows({
      businessId: businessContext.businessId,
      from,
      to,
      limit: EXPORT_LIMIT,
    });

    if (format === "json") {
      return successResponse(res, {
        data: {
          rows: rows.map(mapRepairAuditRow),
          meta: {
            exportedAt: new Date().toISOString(),
            rowCount: rows.length,
            limit: EXPORT_LIMIT,
            period: {
              from: from?.toISOString() ?? null,
              to: to?.toISOString() ?? null,
            },
          },
        },
      });
    }

    const csv = repairAuditRowsToCsv(rows);
    const filename = `financial-repair-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    res.setHeader("X-Exported-At", new Date().toISOString());
    res.setHeader("X-Row-Count", String(rows.length));
    return res.status(200).send(csv);
  } catch (error) {
    return handleApiError(res, error);
  }
});

export default router;
