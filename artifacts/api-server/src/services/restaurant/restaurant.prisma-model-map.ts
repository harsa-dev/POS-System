export const restaurantPrismaModelMap = {
  tenant: {
    model: "Business",
    keyFields: ["id", "mode", "isActive"],
    relations: [
      "restaurant",
      "categories",
      "menuItems",
      "inventoryItems",
      "orders",
      "tables",
      "cashflowEntries",
      "auditLogs",
    ],
  },
  profile: {
    model: "Restaurant",
    keyFields: ["id", "businessId", "taxRate", "serviceRate", "currency", "orderPrefix"],
    relations: ["business"],
  },
  category: {
    model: "Category",
    keyFields: ["id", "businessId", "name"],
    relations: ["business", "menuItems"],
  },
  menuItem: {
    model: "MenuItem",
    keyFields: ["id", "businessId", "categoryId", "name", "price", "isAvailable"],
    relations: ["business", "category", "orderItems", "recipes"],
  },
  inventoryItem: {
    model: "InventoryItem",
    keyFields: [
      "id",
      "businessId",
      "name",
      "type",
      "unit",
      "currentStock",
      "minimumStock",
      "costPerUnit",
    ],
    relations: ["business", "movements", "recipes"],
  },
  recipe: {
    model: "Recipe",
    keyFields: ["id", "menuItemId", "inventoryItemId", "quantityNeeded"],
    relations: ["menuItem", "inventoryItem"],
  },
  table: {
    model: "DiningTable",
    keyFields: ["id", "businessId", "name", "capacity", "status", "isActive"],
    relations: ["business", "orders"],
  },
  order: {
    model: "Order",
    keyFields: [
      "id",
      "businessId",
      "orderNumber",
      "subtotal",
      "taxAmount",
      "serviceAmount",
      "total",
      "paymentMethod",
      "amountPaid",
      "changeAmount",
      "status",
      "inventoryDeducted",
      "tableId",
      "type",
      "cancelReason",
      "cancelledAt",
      "createdAt",
    ],
    relations: ["business", "shift", "table", "items", "payment"],
  },
  orderItem: {
    model: "OrderItem",
    keyFields: ["id", "orderId", "menuItemId", "quantity", "price", "subtotal"],
    relations: ["order", "menuItem"],
  },
  payment: {
    model: "Payment",
    keyFields: ["id", "orderId", "provider", "method", "status", "paidAt"],
    relations: ["order"],
  },
  stockMovement: {
    model: "StockMovement",
    keyFields: [
      "id",
      "businessId",
      "inventoryItemId",
      "type",
      "quantity",
      "reason",
      "source",
      "sourceId",
      "createdById",
    ],
    relations: ["inventoryItem", "business", "createdBy"],
  },
  cashflowEntry: {
    model: "CashflowEntry",
    keyFields: ["id", "businessId", "type", "account", "amount", "status", "sourceType", "sourceId"],
    relations: ["business", "createdBy"],
  },
  auditLog: {
    model: "AuditLog",
    keyFields: ["id", "businessId", "userId", "action", "entityType", "entityId", "changes"],
    relations: ["business", "user"],
  },
} as const;

export const restaurantPrismaEnumMap = {
  businessMode: {
    enum: "BusinessMode",
    values: ["RESTAURANT", "RETAIL", "SERVICE", "LIVESTOCK", "RAW_MATERIAL"],
  },
  orderStatus: {
    enum: "OrderStatus",
    values: ["PENDING_PAYMENT", "PAID", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"],
  },
  paymentStatus: {
    enum: "PaymentStatus",
    values: ["PENDING", "PAID", "FAILED", "EXPIRED"],
  },
  tableStatus: {
    enum: "TableStatus",
    values: ["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING", "INACTIVE"],
  },
  stockMovementReason: {
    enum: "StockMovementReason",
    values: ["RECIPE_USAGE", "RETURN", "CORRECTION", "STOCK_COUNT", "MANUAL_ADJUSTMENT"],
  },
  cashflowSourceType: {
    enum: "CashflowSourceType",
    values: ["ORDER_PAYMENT", "REFUND", "MANUAL", "SYSTEM"],
  },
} as const;

export type RestaurantPrismaModelKey = keyof typeof restaurantPrismaModelMap;
export type RestaurantPrismaEnumKey = keyof typeof restaurantPrismaEnumMap;
