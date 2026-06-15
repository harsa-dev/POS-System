import type { OrderStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { restaurantRepository } from "./restaurant.repository-provider.js";
import type {
  RestaurantBusinessScope,
  RestaurantMenuItemDto,
  RestaurantOrderDto,
  RestaurantOrderPreviewDto,
  RestaurantOrderPreviewInput,
  RestaurantOrderPreviewItemDto,
  RestaurantPaymentPreviewDto,
  RestaurantPaymentPreviewInput,
  RestaurantPreviewSettingsDto,
  RestaurantPreviewWarningDto,
  RestaurantStatusActionPreviewDto,
  RestaurantStatusActionPreviewInput,
  RestaurantStatusActionSurface,
} from "./restaurant.types.js";
import { getRestaurantAllowedNextStatuses } from "./restaurant.workflow.js";

const DEFAULT_TAX_RATE = 0.1;
const DEFAULT_SERVICE_CHARGE_RATE = 0.05;
const DEFAULT_CURRENCY = "IDR";

function nowIso() {
  return new Date().toISOString();
}

function normalizeAmount(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : fallback;
}

function normalizeQuantity(value: unknown) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : 0;
}

function normalizeRate(value: number | null | undefined, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return value > 1 ? value / 100 : value;
}

function hasBlockingWarning(warnings: RestaurantPreviewWarningDto[]) {
  return warnings.some((warning) => warning.status === "blocked");
}

function getTransitionLabel(from: OrderStatus, to: OrderStatus) {
  if (from === "PENDING_PAYMENT" && to === "PAID") return "Confirm payment";
  if (from === "PAID" && to === "PREPARING") return "Start preparation";
  if (from === "PREPARING" && to === "READY") return "Mark ready";
  if (from === "READY" && to === "SERVED") return "Mark served";
  if (from === "SERVED" && to === "COMPLETED") return "Complete order";
  if (to === "CANCELLED") return "Cancel order";
  return `Move ${from} to ${to}`;
}

function getTransitionRoleScope(from: OrderStatus, to: OrderStatus) {
  if (to === "CANCELLED") return "manager" as const;
  if (from === "PENDING_PAYMENT") return "cashier" as const;
  if (from === "PAID" || from === "PREPARING") return "kitchen" as const;
  if (from === "READY" || from === "SERVED") return "server" as const;
  return "manager" as const;
}

function getDefaultTargetStatus(surface: RestaurantStatusActionSurface, status: OrderStatus): OrderStatus | null {
  if (surface === "kitchen") {
    if (status === "PAID") return "PREPARING";
    if (status === "PREPARING") return "READY";
    return null;
  }

  if (status === "READY") return "SERVED";
  if (status === "SERVED") return "COMPLETED";
  return null;
}

function isSurfaceTargetStatus(surface: RestaurantStatusActionSurface, status: OrderStatus) {
  return surface === "kitchen" ? status === "PREPARING" || status === "READY" : status === "SERVED" || status === "COMPLETED";
}

async function getPreviewSettings(scope: RestaurantBusinessScope): Promise<RestaurantPreviewSettingsDto> {
  const settings = await prisma.restaurant.findUnique({
    where: { businessId: scope.businessId },
    select: {
      taxRate: true,
      serviceRate: true,
      currency: true,
    },
  });

  return {
    taxRate: normalizeRate(settings?.taxRate, DEFAULT_TAX_RATE),
    serviceChargeRate: normalizeRate(settings?.serviceRate, DEFAULT_SERVICE_CHARGE_RATE),
    currency: settings?.currency ?? DEFAULT_CURRENCY,
  };
}

function buildOrderItemPreview(menuItem: RestaurantMenuItemDto, quantity: number): RestaurantOrderPreviewItemDto {
  const subtotal = menuItem.price * quantity;

  if (menuItem.recipeIngredients.length === 0) {
    return {
      id: `preview-${menuItem.id}`,
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity,
      price: menuItem.price,
      subtotal,
      isAvailable: menuItem.isAvailable,
      stockStatus: "no_recipe",
      recipeIngredients: menuItem.recipeIngredients,
    };
  }

  const hasOutOfStockIngredient = menuItem.recipeIngredients.some((ingredient) => ingredient.currentStock < ingredient.quantityNeeded * quantity);
  const hasLowStockIngredient = menuItem.recipeIngredients.some((ingredient) => ingredient.currentStock - ingredient.quantityNeeded * quantity <= ingredient.minimumStock);

  return {
    id: `preview-${menuItem.id}`,
    menuItemId: menuItem.id,
    name: menuItem.name,
    quantity,
    price: menuItem.price,
    subtotal,
    isAvailable: menuItem.isAvailable,
    stockStatus: hasOutOfStockIngredient ? "out" : hasLowStockIngredient ? "low" : "ok",
    recipeIngredients: menuItem.recipeIngredients,
  };
}

export class RestaurantPreviewService {
  async previewOrder(scope: RestaurantBusinessScope, input: RestaurantOrderPreviewInput): Promise<RestaurantOrderPreviewDto> {
    const [settings, menuItems, tables] = await Promise.all([
      getPreviewSettings(scope),
      restaurantRepository.listMenuItems(scope),
      restaurantRepository.listTables(scope),
    ]);

    const menuById = new Map(menuItems.map((item) => [item.id, item]));
    const warnings: RestaurantPreviewWarningDto[] = [];
    const requestedItems = Array.isArray(input.items) ? input.items : [];

    const items = requestedItems.flatMap((item) => {
      const quantity = normalizeQuantity(item.quantity);
      const menuItem = menuById.get(item.menuItemId);

      if (!menuItem) {
        warnings.push({
          key: `menu_item.${item.menuItemId}.missing`,
          status: "blocked",
          message: `Menu item ${item.menuItemId} was not found in this restaurant business.`,
        });
        return [];
      }

      if (quantity <= 0) {
        warnings.push({
          key: `menu_item.${item.menuItemId}.quantity`,
          status: "blocked",
          message: `${menuItem.name} must use a positive integer quantity.`,
        });
        return [];
      }

      if (!menuItem.isAvailable) {
        warnings.push({
          key: `menu_item.${item.menuItemId}.availability`,
          status: "blocked",
          message: `${menuItem.name} is currently disabled and cannot be sold.`,
        });
      }

      const previewItem = buildOrderItemPreview(menuItem, quantity);

      if (previewItem.stockStatus === "out") {
        warnings.push({
          key: `menu_item.${item.menuItemId}.stock`,
          status: "blocked",
          message: `${menuItem.name} does not have enough recipe stock for quantity ${quantity}.`,
        });
      } else if (previewItem.stockStatus === "low") {
        warnings.push({
          key: `menu_item.${item.menuItemId}.stock`,
          status: "review",
          message: `${menuItem.name} can be sold, but at least one ingredient will hit low stock.`,
        });
      } else if (previewItem.stockStatus === "no_recipe") {
        warnings.push({
          key: `menu_item.${item.menuItemId}.recipe`,
          status: "review",
          message: `${menuItem.name} has no recipe lines, so stock deduction cannot be simulated.`,
        });
      }

      return [previewItem];
    });

    const table = input.tableId ? tables.find((item) => item.id === input.tableId) ?? null : null;

    if (input.type === "DINE_IN" && !table) {
      warnings.push({
        key: "table.required",
        status: "blocked",
        message: "Dine-in preview requires an active dining table.",
      });
    }

    if (table && table.status !== "AVAILABLE") {
      warnings.push({
        key: `table.${table.id}.status`,
        status: "blocked",
        message: `${table.name} is currently ${table.status} and cannot be assigned to a new dine-in order.`,
      });
    }

    if (items.length === 0) {
      warnings.push({
        key: "order.items.empty",
        status: "blocked",
        message: "Order preview requires at least one valid menu item.",
      });
    }

    const subtotal = items.reduce((total, item) => total + item.subtotal, 0);
    const taxAmount = Math.round(subtotal * settings.taxRate);
    const serviceAmount = Math.round(subtotal * settings.serviceChargeRate);
    const total = subtotal + taxAmount + serviceAmount;
    const amountPaid = normalizeAmount(input.amountPaid);
    const changeAmount = Math.max(0, amountPaid - total);

    return {
      kind: "order",
      generatedAt: nowIso(),
      table,
      paymentMethod: input.paymentMethod || "CASH",
      nextStatus: "PENDING_PAYMENT",
      items,
      totals: {
        subtotal,
        taxRate: settings.taxRate,
        taxAmount,
        serviceChargeRate: settings.serviceChargeRate,
        serviceAmount,
        total,
        amountPaid,
        changeAmount,
      },
      canSubmit: items.length > 0 && !hasBlockingWarning(warnings),
      warnings,
      source: "preview",
    };
  }

  async previewPayment(scope: RestaurantBusinessScope, input: RestaurantPaymentPreviewInput): Promise<RestaurantPaymentPreviewDto> {
    const orders = await restaurantRepository.listActiveOrders(scope);
    const order = orders.find((item) => item.id === input.orderId) ?? null;
    const warnings: RestaurantPreviewWarningDto[] = [];

    if (!order) {
      warnings.push({
        key: "order.not_found",
        status: "blocked",
        message: "Order was not found in the active Restaurant workflow.",
      });
    }

    const amountPaid = normalizeAmount(input.amountPaid, order?.amountPaid ?? 0);
    const amountDue = Math.max(0, (order?.total ?? 0) - amountPaid);
    const changeAmount = Math.max(0, amountPaid - (order?.total ?? 0));
    const canConfirm = Boolean(order && order.status === "PENDING_PAYMENT" && amountPaid >= order.total);

    if (order && order.status !== "PENDING_PAYMENT") {
      warnings.push({
        key: "payment.status_not_pending",
        status: "blocked",
        message: `Order ${order.code} is ${order.status}, so payment confirmation is not available from this preview.`,
      });
    }

    if (order && order.status === "PENDING_PAYMENT" && amountPaid < order.total) {
      warnings.push({
        key: "payment.amount_due",
        status: "review",
        message: `Payment is short by ${order.total - amountPaid}.`,
      });
    }

    return {
      kind: "payment",
      generatedAt: nowIso(),
      order,
      paymentMethod: input.paymentMethod || order?.paymentMethod || null,
      amountDue,
      amountPaid,
      changeAmount,
      currentStatus: order?.status ?? null,
      nextStatus: canConfirm ? "PAID" : order?.status ?? null,
      canConfirm,
      warnings,
      source: "preview",
    };
  }

  async previewStatusAction(scope: RestaurantBusinessScope, surface: RestaurantStatusActionSurface, input: RestaurantStatusActionPreviewInput): Promise<RestaurantStatusActionPreviewDto> {
    const orders = await restaurantRepository.listActiveOrders(scope);
    const order = orders.find((item) => item.id === input.orderId) ?? null;
    const warnings: RestaurantPreviewWarningDto[] = [];
    const currentStatus = order?.status ?? null;
    const targetStatus = currentStatus ? input.targetStatus ?? getDefaultTargetStatus(surface, currentStatus) : null;
    const allowedNextStatuses = currentStatus ? getRestaurantAllowedNextStatuses(currentStatus) : [];
    const allowed = Boolean(order && targetStatus && isSurfaceTargetStatus(surface, targetStatus) && allowedNextStatuses.includes(targetStatus));

    if (!order) {
      warnings.push({
        key: "order.not_found",
        status: "blocked",
        message: "Order was not found in the active Restaurant workflow.",
      });
    }

    if (order && !targetStatus) {
      warnings.push({
        key: `${surface}.target_status_missing`,
        status: "blocked",
        message: `${surface} preview cannot infer a next status from ${order.status}.`,
      });
    }

    if (order && targetStatus && !isSurfaceTargetStatus(surface, targetStatus)) {
      warnings.push({
        key: `${surface}.target_status_scope`,
        status: "blocked",
        message: `${targetStatus} is not handled by the Restaurant ${surface} workflow surface.`,
      });
    }

    if (order && targetStatus && !allowedNextStatuses.includes(targetStatus)) {
      warnings.push({
        key: `${surface}.transition_not_allowed`,
        status: "blocked",
        message: `Transition ${order.status} -> ${targetStatus} is not allowed by the Restaurant workflow map.`,
      });
    }

    return {
      kind: surface,
      generatedAt: nowIso(),
      order,
      currentStatus,
      targetStatus,
      allowed,
      transition: currentStatus && targetStatus
        ? {
            actionKey: `${currentStatus.toLowerCase()}_to_${targetStatus.toLowerCase()}`,
            label: getTransitionLabel(currentStatus, targetStatus),
            roleScope: getTransitionRoleScope(currentStatus, targetStatus),
          }
        : null,
      warnings,
      source: "preview",
    };
  }
}

export const restaurantPreviewService = new RestaurantPreviewService();
