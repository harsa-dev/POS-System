import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, "../prisma/schema.prisma");
const schema = readFileSync(schemaPath, "utf8");

const requiredModels = {
  Business: [
    "id",
    "mode",
    "isActive",
    "restaurant",
    "categories",
    "menuItems",
    "inventoryItems",
    "orders",
    "tables",
    "cashflowEntries",
    "auditLogs",
  ],
  Restaurant: ["id", "businessId", "taxRate", "serviceRate", "currency", "orderPrefix", "business"],
  Category: ["id", "businessId", "name", "business", "menuItems"],
  MenuItem: ["id", "businessId", "categoryId", "name", "price", "isAvailable", "business", "category", "orderItems", "recipes"],
  InventoryItem: [
    "id",
    "businessId",
    "name",
    "type",
    "unit",
    "currentStock",
    "minimumStock",
    "costPerUnit",
    "business",
    "movements",
    "recipes",
  ],
  Recipe: ["id", "menuItemId", "inventoryItemId", "quantityNeeded", "menuItem", "inventoryItem"],
  DiningTable: ["id", "businessId", "name", "capacity", "status", "isActive", "business", "orders"],
  Order: [
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
    "business",
    "table",
    "items",
    "payment",
  ],
  OrderItem: ["id", "orderId", "menuItemId", "quantity", "price", "subtotal", "order", "menuItem"],
  Payment: ["id", "orderId", "provider", "method", "status", "paidAt", "order"],
  StockMovement: ["id", "businessId", "inventoryItemId", "type", "quantity", "reason", "source", "sourceId", "createdById", "inventoryItem", "business"],
  CashflowEntry: ["id", "businessId", "type", "account", "amount", "status", "sourceType", "sourceId", "business"],
  AuditLog: ["id", "businessId", "userId", "action", "entityType", "entityId", "changes", "business", "user"],
};

const requiredEnums = {
  BusinessMode: ["RESTAURANT", "RETAIL", "SERVICE", "LIVESTOCK", "RAW_MATERIAL"],
  OrderStatus: ["PENDING_PAYMENT", "PAID", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"],
  PaymentStatus: ["PENDING", "PAID", "FAILED", "EXPIRED"],
  TableStatus: ["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING", "INACTIVE"],
  StockMovementReason: ["RECIPE_USAGE", "RETURN", "CORRECTION", "STOCK_COUNT", "MANUAL_ADJUSTMENT"],
  StockMovementSource: ["ORDER", "RECIPE", "RETURN", "STOCK_COUNT", "SYSTEM"],
  CashflowSourceType: ["ORDER_PAYMENT", "REFUND", "MANUAL", "SYSTEM"],
};

const failures = [];

function blockFor(kind, name) {
  const pattern = new RegExp(`\\b${kind}\\s+${name}\\s+\\{([\\s\\S]*?)\\n\\}`, "m");
  return schema.match(pattern)?.[1] ?? null;
}

function hasField(block, field) {
  return new RegExp(`^\\s*${field}\\b`, "m").test(block);
}

for (const [model, fields] of Object.entries(requiredModels)) {
  const block = blockFor("model", model);

  if (!block) {
    failures.push(`Missing model ${model}`);
    continue;
  }

  for (const field of fields) {
    if (!hasField(block, field)) failures.push(`Missing field ${model}.${field}`);
  }
}

for (const [enumName, values] of Object.entries(requiredEnums)) {
  const block = blockFor("enum", enumName);

  if (!block) {
    failures.push(`Missing enum ${enumName}`);
    continue;
  }

  for (const value of values) {
    if (!hasField(block, value)) failures.push(`Missing enum value ${enumName}.${value}`);
  }
}

if (failures.length > 0) {
  console.error("Restaurant Prisma schema mapping verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Restaurant Prisma schema mapping verification passed.");
console.log("Canonical Restaurant models: Business, Restaurant, Category, MenuItem, InventoryItem, Recipe, DiningTable, Order, OrderItem, Payment, StockMovement, CashflowEntry, AuditLog.");
