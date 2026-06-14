import type {
  InventoryItem,
  Prisma,
  StockMovement,
} from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { prisma } from "../../lib/prisma.js";
import {
  INVENTORY_DASHBOARD_RECENT_MOVEMENT_LIMIT,
  INVENTORY_TYPES,
  INVENTORY_UNITS,
  STOCK_MOVEMENT_REASONS,
  STOCK_MOVEMENT_SOURCES,
  STOCK_MOVEMENT_TYPES,
} from "./inventory.constants.js";
import {
  toInventoryDashboardDto,
  toInventoryItemDto,
} from "./inventory.dto.js";
import {
  requireInventoryAdjust,
  requireInventoryView,
} from "./inventory.permissions.js";
import type {
  InventoryActor,
  InventoryDashboardDto,
} from "./inventory.types.js";
import {
  assertEnum,
  assertRequiredString,
  parseNonNegativeNumber,
  parseOptionalString,
  parsePositiveNumber,
  parseStockMovementLimit,
} from "./inventory.validation.js";

type ParsedCreateStockMovementInput = {
  inventoryItemId: string;
  type: StockMovement["type"];
  quantity: number;
  reason?: StockMovement["reason"];
  note: string | null;
  sourceType?: NonNullable<StockMovement["sourceType"]>;
  sourceId: string | null;
};

function restaurantScope(businessContext: BusinessContext) {
  return { restaurantId: businessContext.restaurantId };
}

function writableBusinessId(businessContext: BusinessContext) {
  return businessContext.businessId;
}

async function loadInventoryItemOrThrow(businessContext: BusinessContext, id: string) {
  const item = await prisma.inventoryItem.findFirst({
    where: {
      id,
      ...restaurantScope(businessContext),
    },
  });

  if (!item) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.inventoryItemNotFound,
      message: "Inventory item not found.",
    });
  }

  return item;
}

async function loadInventoryItemWithCountsOrThrow(
  businessContext: BusinessContext,
  id: string
) {
  const item = await prisma.inventoryItem.findFirst({
    where: {
      id,
      ...restaurantScope(businessContext),
    },
    include: {
      _count: {
        select: {
          recipes: true,
          movements: true,
        },
      },
    },
  });

  if (!item) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.inventoryItemNotFound,
      message: "Inventory item not found.",
    });
  }

  return item;
}

async function assertInventoryNameAvailable(params: {
  businessContext: BusinessContext;
  name: string;
  excludeId?: string;
}) {
  const { businessContext, name, excludeId } = params;

  const duplicate = await prisma.inventoryItem.findFirst({
    where: {
      ...restaurantScope(businessContext),
      name,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (!duplicate) return;

  throw new AppError({
    statusCode: 409,
    code: errorCodes.conflict,
    message: "Inventory item name already exists.",
    details: { name },
  });
}

export async function listInventoryItems(params: {
  actor: InventoryActor;
  businessContext: BusinessContext;
}) {
  const { actor, businessContext } = params;

  requireInventoryView(actor);

  const items = await prisma.inventoryItem.findMany({
    where: restaurantScope(businessContext),
    include: {
      _count: {
        select: {
          recipes: true,
          movements: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map(toInventoryItemDto);
}

export async function getInventoryDashboard(params: {
  actor: InventoryActor;
  businessContext: BusinessContext;
}): Promise<InventoryDashboardDto> {
  const { actor, businessContext } = params;

  const items = await listInventoryItems({ actor, businessContext });
  const recentMovements = await listStockMovements({
    actor,
    businessContext,
    limit: INVENTORY_DASHBOARD_RECENT_MOVEMENT_LIMIT,
  });

  return toInventoryDashboardDto({ items, recentMovements });
}

export async function createInventoryItem(params: {
  actor: InventoryActor;
  businessContext: BusinessContext;
  input: Record<string, unknown>;
}) {
  const { actor, businessContext, input } = params;

  requireInventoryAdjust(actor);

  const name = assertRequiredString(input.name, "name");
  const sku = parseOptionalString(input.sku);
  const type = assertEnum(input.type, INVENTORY_TYPES, "type");
  const unit = assertEnum(input.unit, INVENTORY_UNITS, "unit");
  const openingStock = parseNonNegativeNumber(
    input.currentStock ?? input.openingStock,
    "openingStock",
    0
  );
  const minimumStock = parseNonNegativeNumber(input.minimumStock, "minimumStock", 0);
  const costPerUnit = Math.round(parseNonNegativeNumber(input.costPerUnit, "costPerUnit", 0));
  const businessId = writableBusinessId(businessContext);

  await assertInventoryNameAvailable({ businessContext, name });

  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.create({
      data: {
        name,
        sku,
        type,
        unit,
        currentStock: 0,
        minimumStock,
        costPerUnit,
        businessId,
        restaurantId: businessContext.restaurantId,
      },
    });

    let finalItem = item;

    if (openingStock > 0) {
      await tx.stockMovement.create({
        data: {
          businessId,
          restaurantId: businessContext.restaurantId,
          actorId: actor.id,
          inventoryItemId: item.id,
          type: "IN",
          quantity: openingStock,
          sourceType: "MANUAL",
          source: "MANUAL",
          sourceId: null,
          reason: "OPENING_STOCK",
          note: "Opening stock",
        },
      });

      finalItem = await tx.inventoryItem.update({
        where: { id: item.id },
        data: { currentStock: openingStock },
      });
    }

    await tx.auditLog.create({
      data: {
        businessId,
        restaurantId: businessContext.restaurantId,
        userId: actor.id,
        action: "CREATE",
        entityType: "InventoryItem",
        entityId: item.id,
        changes: {
          businessId,
          name,
          sku,
          type,
          unit,
          openingStock,
          minimumStock,
          costPerUnit,
        },
      },
    });

    return toInventoryItemDto({
      ...finalItem,
      _count: {
        recipes: 0,
        movements: openingStock > 0 ? 1 : 0,
      },
    });
  });
}

export async function updateInventoryItem(params: {
  actor: InventoryActor;
  businessContext: BusinessContext;
  id: string;
  input: Record<string, unknown>;
}) {
  const { actor, businessContext, id, input } = params;

  requireInventoryAdjust(actor);

  const existing = await loadInventoryItemOrThrow(businessContext, id);

  const data: Partial<Pick<InventoryItem, "name" | "sku" | "type" | "unit" | "minimumStock" | "costPerUnit">> = {};

  if (input.name !== undefined) {
    const nextName = assertRequiredString(input.name, "name");

    if (nextName !== existing.name) {
      await assertInventoryNameAvailable({
        businessContext,
        name: nextName,
        excludeId: existing.id,
      });
    }

    data.name = nextName;
  }

  if (input.sku !== undefined) data.sku = parseOptionalString(input.sku);
  if (input.type !== undefined) data.type = assertEnum(input.type, INVENTORY_TYPES, "type");
  if (input.unit !== undefined) data.unit = assertEnum(input.unit, INVENTORY_UNITS, "unit");
  if (input.minimumStock !== undefined) {
    data.minimumStock = parseNonNegativeNumber(input.minimumStock, "minimumStock");
  }
  if (input.costPerUnit !== undefined) {
    data.costPerUnit = Math.round(parseNonNegativeNumber(input.costPerUnit, "costPerUnit"));
  }

  const targetStock = input.currentStock !== undefined
    ? parseNonNegativeNumber(input.currentStock, "currentStock")
    : undefined;

  const hasMetadataUpdate = Object.keys(data).length > 0;
  const hasStockAdjustment = targetStock !== undefined && targetStock !== existing.currentStock;

  if (!hasMetadataUpdate && !hasStockAdjustment) {
    return toInventoryItemDto(await loadInventoryItemWithCountsOrThrow(businessContext, existing.id));
  }

  return prisma.$transaction(async (tx) => {
    let item = existing;

    if (hasMetadataUpdate) {
      item = await tx.inventoryItem.update({
        where: { id: existing.id },
        data,
      });
    }

    if (hasStockAdjustment && targetStock !== undefined) {
      await tx.stockMovement.create({
        data: {
          businessId: existing.businessId ?? writableBusinessId(businessContext),
          restaurantId: businessContext.restaurantId,
          actorId: actor.id,
          inventoryItemId: existing.id,
          type: "ADJUSTMENT",
          quantity: targetStock,
          sourceType: "MANUAL",
          source: "MANUAL",
          sourceId: null,
          reason: "MANUAL_ADJUSTMENT",
          note: "Manual stock adjustment from inventory item update",
        },
      });

      item = await tx.inventoryItem.update({
        where: { id: existing.id },
        data: { currentStock: targetStock },
      });
    }

    const changes: Prisma.InputJsonObject = {
      metadata: data as Prisma.InputJsonObject,
      ...(hasStockAdjustment && targetStock !== undefined
        ? {
            stockAdjustment: {
              from: existing.currentStock,
              to: targetStock,
            },
          }
        : {}),
    };

    await tx.auditLog.create({
      data: {
        businessId: writableBusinessId(businessContext),
        restaurantId: businessContext.restaurantId,
        userId: actor.id,
        action: "UPDATE",
        entityType: "InventoryItem",
        entityId: existing.id,
        changes,
      },
    });

    const withCounts = await tx.inventoryItem.findUniqueOrThrow({
      where: { id: item.id },
      include: {
        _count: {
          select: {
            recipes: true,
            movements: true,
          },
        },
      },
    });

    return toInventoryItemDto(withCounts);
  });
}

export async function deleteInventoryItem(params: {
  actor: InventoryActor;
  businessContext: BusinessContext;
  id: string;
}) {
  const { actor, businessContext, id } = params;

  requireInventoryAdjust(actor);

  const existing = await loadInventoryItemWithCountsOrThrow(businessContext, id);

  if (existing._count.recipes > 0 || existing._count.movements > 0) {
    throw new AppError({
      statusCode: 409,
      code: errorCodes.conflict,
      message: "Inventory item cannot be deleted because it is already used by recipes or stock movements.",
      details: {
        recipeCount: existing._count.recipes,
        movementCount: existing._count.movements,
      },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventoryItem.delete({ where: { id: existing.id } });

    await tx.auditLog.create({
      data: {
        businessId: writableBusinessId(businessContext),
        restaurantId: businessContext.restaurantId,
        userId: actor.id,
        action: "DELETE",
        entityType: "InventoryItem",
        entityId: existing.id,
        changes: {
          businessId: existing.businessId,
          name: existing.name,
          sku: existing.sku,
          type: existing.type,
          unit: existing.unit,
        },
      },
    });
  });

  return { id };
}

export async function listStockMovements(params: {
  actor: InventoryActor;
  businessContext: BusinessContext;
  inventoryItemId?: string;
  limit?: number;
}) {
  const { actor, businessContext, inventoryItemId, limit } = params;

  requireInventoryView(actor);

  if (inventoryItemId) {
    await loadInventoryItemOrThrow(businessContext, inventoryItemId);
  }

  const take = parseStockMovementLimit(limit);

  return prisma.stockMovement.findMany({
    where: {
      ...(inventoryItemId ? { inventoryItemId } : {}),
      inventoryItem: restaurantScope(businessContext),
    },
    include: { inventoryItem: true },
    orderBy: { createdAt: "desc" },
    take,
  });
}

function parseCreateStockMovementInput(input: Record<string, unknown>): ParsedCreateStockMovementInput {
  const inventoryItemId = assertRequiredString(input.inventoryItemId, "inventoryItemId");
  const type = assertEnum(input.type, STOCK_MOVEMENT_TYPES, "type");
  const quantity = type === "ADJUSTMENT"
    ? parseNonNegativeNumber(input.quantity, "quantity")
    : parsePositiveNumber(input.quantity, "quantity");
  const reason = input.reason
    ? assertEnum(input.reason, STOCK_MOVEMENT_REASONS, "reason")
    : undefined;
  const sourceType = input.sourceType
    ? assertEnum(input.sourceType, STOCK_MOVEMENT_SOURCES, "sourceType")
    : undefined;
  const sourceId = parseOptionalString(input.sourceId);
  const note = parseOptionalString(input.note);

  return {
    inventoryItemId,
    type,
    quantity,
    reason,
    sourceType,
    sourceId,
    note,
  };
}

export async function createStockMovement(params: {
  actor: InventoryActor;
  businessContext: BusinessContext;
  input: Record<string, unknown>;
}) {
  const { actor, businessContext, input } = params;

  requireInventoryAdjust(actor);

  const parsed = parseCreateStockMovementInput(input);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.inventoryItem.findFirst({
      where: {
        id: parsed.inventoryItemId,
        ...restaurantScope(businessContext),
      },
    });

    if (!existing) {
      throw new AppError({
        statusCode: 404,
        code: errorCodes.inventoryItemNotFound,
        message: "Inventory item not found.",
      });
    }

    let updatedItem = existing;

    if (parsed.type === "IN") {
      updatedItem = await tx.inventoryItem.update({
        where: { id: parsed.inventoryItemId },
        data: { currentStock: { increment: parsed.quantity } },
      });
    }

    if (parsed.type === "OUT") {
      const result = await tx.inventoryItem.updateMany({
        where: {
          id: parsed.inventoryItemId,
          ...restaurantScope(businessContext),
          currentStock: { gte: parsed.quantity },
        },
        data: { currentStock: { decrement: parsed.quantity } },
      });

      if (result.count === 0) {
        throw new AppError({
          statusCode: 409,
          code: errorCodes.negativeStockNotAllowed,
          message: "Stock cannot be negative.",
          details: {
            inventoryItemId: parsed.inventoryItemId,
            currentStock: existing.currentStock,
            requestedQuantity: parsed.quantity,
          },
        });
      }

      updatedItem = await tx.inventoryItem.findUniqueOrThrow({
        where: { id: parsed.inventoryItemId },
      });
    }

    if (parsed.type === "ADJUSTMENT") {
      updatedItem = await tx.inventoryItem.update({
        where: { id: parsed.inventoryItemId },
        data: { currentStock: parsed.quantity },
      });
    }

    const effectiveReason = parsed.reason
      ?? (parsed.type === "ADJUSTMENT" ? "MANUAL_ADJUSTMENT" : undefined);
    const movementBusinessId = existing.businessId ?? writableBusinessId(businessContext);
    const movementSourceType = parsed.sourceType ?? "MANUAL";

    const movement = await tx.stockMovement.create({
      data: {
        businessId: movementBusinessId,
        restaurantId: businessContext.restaurantId,
        actorId: actor.id,
        inventoryItemId: parsed.inventoryItemId,
        type: parsed.type,
        quantity: parsed.quantity,
        sourceType: movementSourceType,
        source: movementSourceType,
        sourceId: parsed.sourceId,
        note: parsed.note,
        reason: effectiveReason,
      },
      include: { inventoryItem: true },
    });

    await tx.auditLog.create({
      data: {
        businessId: movementBusinessId,
        restaurantId: businessContext.restaurantId,
        userId: actor.id,
        action: "CREATE",
        entityType: "StockMovement",
        entityId: movement.id,
        changes: {
          businessId: movementBusinessId,
          inventoryItemId: parsed.inventoryItemId,
          type: parsed.type,
          quantity: parsed.quantity,
          reason: effectiveReason ?? null,
          sourceType: movementSourceType,
          sourceId: parsed.sourceId,
          previousStock: existing.currentStock,
          newStock: updatedItem.currentStock,
        },
      },
    });

    return movement;
  });
}
