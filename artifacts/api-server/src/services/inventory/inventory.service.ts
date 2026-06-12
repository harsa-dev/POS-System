import type {
  InventoryItem,
  InventoryType,
  InventoryUnit,
  Role,
  StockMovementReason,
  StockMovementType,
} from "@prisma/client";

import type { BusinessContext } from "../../lib/business-context/business-context.types.js";
import { AppError } from "../../lib/errors/app-error.js";
import { errorCodes } from "../../lib/errors/error-codes.js";
import { prisma } from "../../lib/prisma.js";
import {
  permissionKeys,
  requirePermission,
} from "../permissions/index.js";

const INVENTORY_TYPES: readonly InventoryType[] = ["INGREDIENT", "PACKAGING", "EQUIPMENT"];

const INVENTORY_UNITS: readonly InventoryUnit[] = [
  "PCS",
  "GRAM",
  "KILOGRAM",
  "LITER",
  "ML",
  "PACK",
  "BOTTLE",
];

const STOCK_MOVEMENT_TYPES: readonly StockMovementType[] = ["IN", "OUT", "ADJUSTMENT"];

const STOCK_MOVEMENT_REASONS: readonly StockMovementReason[] = [
  "PURCHASE",
  "RECIPE_USAGE",
  "WASTE",
  "EXPIRED",
  "MANUAL_ADJUSTMENT",
  "DAMAGED",
  "RETURN",
];

export type InventoryActor = {
  id: string;
  role: Role;
};

export type InventoryItemDto = InventoryItem & {
  recipeCount: number;
  movementCount: number;
  stockStatus: "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";
  isLowStock: boolean;
  isOutOfStock: boolean;
  stockValue: number;
};

export type InventoryDashboardDto = {
  summary: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalStockValue: number;
    ingredientItems: number;
    packagingItems: number;
    equipmentItems: number;
  };
  items: InventoryItemDto[];
  lowStockItems: InventoryItemDto[];
  recentMovements: Awaited<ReturnType<typeof listStockMovements>>;
};

function assertString(value: unknown, field: string) {
  if (typeof value === "string" && value.trim()) return value.trim();

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: `${field} is required.`,
  });
}

function parseOptionalString(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string") return value.trim() || null;
  return String(value).trim() || null;
}

function assertEnum<T extends string>(value: unknown, allowed: readonly T[], field: string) {
  if (typeof value === "string" && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }

  throw new AppError({
    statusCode: 400,
    code: errorCodes.validationError,
    message: `Invalid ${field}.`,
    details: { field, allowed },
  });
}

function parseNonNegativeNumber(value: unknown, field: string, defaultValue?: number) {
  if (value === undefined || value === null || value === "") {
    if (defaultValue !== undefined) return defaultValue;

    throw new AppError({
      statusCode: 400,
      code: errorCodes.validationError,
      message: `${field} is required.`,
    });
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.invalidStockQuantity,
      message: `${field} must be a non-negative number.`,
    });
  }

  return numberValue;
}

function parsePositiveNumber(value: unknown, field: string) {
  const numberValue = parseNonNegativeNumber(value, field);

  if (numberValue <= 0) {
    throw new AppError({
      statusCode: 400,
      code: errorCodes.invalidStockQuantity,
      message: `${field} must be greater than zero.`,
    });
  }

  return numberValue;
}

function toInventoryItemDto(
  item: InventoryItem & {
    _count?: { recipes?: number; movements?: number };
  }
): InventoryItemDto {
  const isOutOfStock = item.currentStock <= 0;
  const isLowStock = !isOutOfStock && item.currentStock <= item.minimumStock;

  return {
    ...item,
    recipeCount: item._count?.recipes ?? 0,
    movementCount: item._count?.movements ?? 0,
    stockStatus: isOutOfStock ? "OUT_OF_STOCK" : isLowStock ? "LOW_STOCK" : "IN_STOCK",
    isLowStock,
    isOutOfStock,
    stockValue: Math.round(item.currentStock * item.costPerUnit),
  };
}

function restaurantScope(businessContext: BusinessContext) {
  return { restaurantId: businessContext.restaurantId };
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

function requireInventoryView(actor: InventoryActor) {
  requirePermission(actor.role, permissionKeys.shared.inventory.view);
}

function requireInventoryAdjust(actor: InventoryActor) {
  requirePermission(actor.role, permissionKeys.shared.inventory.adjust);
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
  const recentMovements = await listStockMovements({ actor, businessContext, limit: 10 });

  return {
    summary: {
      totalItems: items.length,
      lowStockItems: items.filter((item) => item.isLowStock).length,
      outOfStockItems: items.filter((item) => item.isOutOfStock).length,
      totalStockValue: items.reduce((total, item) => total + item.stockValue, 0),
      ingredientItems: items.filter((item) => item.type === "INGREDIENT").length,
      packagingItems: items.filter((item) => item.type === "PACKAGING").length,
      equipmentItems: items.filter((item) => item.type === "EQUIPMENT").length,
    },
    items,
    lowStockItems: items.filter((item) => item.isLowStock || item.isOutOfStock),
    recentMovements,
  };
}

export async function createInventoryItem(params: {
  actor: InventoryActor;
  businessContext: BusinessContext;
  input: Record<string, unknown>;
}) {
  const { actor, businessContext, input } = params;

  requireInventoryAdjust(actor);

  const name = assertString(input.name, "name");
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
        restaurantId: businessContext.restaurantId,
      },
    });

    let finalItem = item;

    if (openingStock > 0) {
      await tx.stockMovement.create({
        data: {
          inventoryItemId: item.id,
          type: "IN",
          quantity: openingStock,
          reason: "PURCHASE",
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
        restaurantId: businessContext.restaurantId,
        userId: actor.id,
        action: "CREATE",
        entityType: "InventoryItem",
        entityId: item.id,
        changes: {
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

  if (input.name !== undefined) data.name = assertString(input.name, "name");
  if (input.sku !== undefined) data.sku = parseOptionalString(input.sku);
  if (input.type !== undefined) data.type = assertEnum(input.type, INVENTORY_TYPES, "type");
  if (input.unit !== undefined) data.unit = assertEnum(input.unit, INVENTORY_UNITS, "unit");
  if (input.minimumStock !== undefined) {
    data.minimumStock = parseNonNegativeNumber(input.minimumStock, "minimumStock");
  }
  if (input.costPerUnit !== undefined) {
    data.costPerUnit = Math.round(parseNonNegativeNumber(input.costPerUnit, "costPerUnit"));
  }

  const hasStockPatch = input.currentStock !== undefined;
  const targetStock = hasStockPatch
    ? parseNonNegativeNumber(input.currentStock, "currentStock")
    : undefined;

  return prisma.$transaction(async (tx) => {
    let item = await tx.inventoryItem.update({
      where: { id: existing.id },
      data,
    });

    if (targetStock !== undefined && targetStock !== existing.currentStock) {
      await tx.stockMovement.create({
        data: {
          inventoryItemId: existing.id,
          type: "ADJUSTMENT",
          quantity: targetStock,
          reason: "MANUAL_ADJUSTMENT",
          note: "Manual stock adjustment from inventory item update",
        },
      });

      item = await tx.inventoryItem.update({
        where: { id: existing.id },
        data: { currentStock: targetStock },
      });
    }

    await tx.auditLog.create({
      data: {
        restaurantId: businessContext.restaurantId,
        userId: actor.id,
        action: "UPDATE",
        entityType: "InventoryItem",
        entityId: existing.id,
        changes: {
          metadata: data,
          stockAdjustment:
            targetStock !== undefined
              ? {
                  from: existing.currentStock,
                  to: targetStock,
                }
              : undefined,
        },
      },
    });

    const withCounts = await tx.inventoryItem.findUniqueOrThrow({
      where: { id: existing.id },
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

  const existing = await prisma.inventoryItem.findFirst({
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

  if (!existing) {
    throw new AppError({
      statusCode: 404,
      code: errorCodes.inventoryItemNotFound,
      message: "Inventory item not found.",
    });
  }

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
        restaurantId: businessContext.restaurantId,
        userId: actor.id,
        action: "DELETE",
        entityType: "InventoryItem",
        entityId: existing.id,
        changes: {
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
  const { actor, businessContext, inventoryItemId, limit = 50 } = params;

  requireInventoryView(actor);

  if (inventoryItemId) {
    await loadInventoryItemOrThrow(businessContext, inventoryItemId);
  }

  const take = Math.min(Math.max(Number(limit) || 50, 1), 100);

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

export async function createStockMovement(params: {
  actor: InventoryActor;
  businessContext: BusinessContext;
  input: Record<string, unknown>;
}) {
  const { actor, businessContext, input } = params;

  requireInventoryAdjust(actor);

  const inventoryItemId = assertString(input.inventoryItemId, "inventoryItemId");
  const type = assertEnum(input.type, STOCK_MOVEMENT_TYPES, "type");
  const reason = input.reason
    ? assertEnum(input.reason, STOCK_MOVEMENT_REASONS, "reason")
    : undefined;
  const note = parseOptionalString(input.note);

  const existing = await loadInventoryItemOrThrow(businessContext, inventoryItemId);
  const quantity = type === "ADJUSTMENT"
    ? parseNonNegativeNumber(input.quantity, "quantity")
    : parsePositiveNumber(input.quantity, "quantity");

  let newStock = existing.currentStock;

  if (type === "IN") newStock += quantity;
  if (type === "OUT") newStock -= quantity;
  if (type === "ADJUSTMENT") newStock = quantity;

  if (newStock < 0) {
    throw new AppError({
      statusCode: 409,
      code: errorCodes.negativeStockNotAllowed,
      message: "Stock cannot be negative.",
      details: {
        inventoryItemId,
        currentStock: existing.currentStock,
        requestedQuantity: quantity,
      },
    });
  }

  return prisma.$transaction(async (tx) => {
    const movement = await tx.stockMovement.create({
      data: {
        inventoryItemId,
        type,
        quantity,
        note,
        reason: reason ?? (type === "ADJUSTMENT" ? "MANUAL_ADJUSTMENT" : undefined),
      },
      include: { inventoryItem: true },
    });

    await tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: { currentStock: newStock },
    });

    await tx.auditLog.create({
      data: {
        restaurantId: businessContext.restaurantId,
        userId: actor.id,
        action: "CREATE",
        entityType: "StockMovement",
        entityId: movement.id,
        changes: {
          inventoryItemId,
          type,
          quantity,
          reason: reason ?? null,
          previousStock: existing.currentStock,
          newStock,
        },
      },
    });

    return movement;
  });
}
