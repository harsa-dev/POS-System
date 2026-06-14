import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

loadEnvFile();

const { prisma } = await import("../src/lib/prisma.js");

type BusinessSeedTarget = {
  id: string;
  name: string;
};

type CategorySeed = {
  id: string;
  name: string;
};

type InventorySeed = {
  id: string;
  name: string;
  sku: string;
  unit: "GRAM" | "ML" | "PCS" | "PACK" | "LITER" | "KILOGRAM";
  currentStock: number;
  minimumStock: number;
  costPerUnit: number;
};

type MenuSeed = {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  price: number;
  isAvailable: boolean;
  recipes: Array<{
    inventoryId: string;
    quantityNeeded: number;
  }>;
};

type TableSeed = {
  id: string;
  name: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "RESERVED";
};

type OrderSeed = {
  id: string;
  orderNumber: number;
  tableId?: string;
  type: "DINE_IN" | "TAKEAWAY";
  status: "PENDING_PAYMENT" | "PAID" | "PREPARING" | "READY" | "SERVED" | "COMPLETED";
  paymentMethod: "CASH" | "QRIS" | "CARD";
  createdMinutesAgo: number;
  items: Array<{
    menuId: string;
    quantity: number;
  }>;
};

const categories: CategorySeed[] = [
  { id: "coffee", name: "Coffee" },
  { id: "main-course", name: "Main Course" },
  { id: "dessert", name: "Dessert" },
  { id: "beverage", name: "Beverage" },
];

const inventoryItems: InventorySeed[] = [
  {
    id: "arabica-beans",
    name: "Arabica Beans",
    sku: "RST-ING-BEAN-001",
    unit: "GRAM",
    currentStock: 5200,
    minimumStock: 1500,
    costPerUnit: 95,
  },
  {
    id: "fresh-milk",
    name: "Fresh Milk",
    sku: "RST-ING-MILK-002",
    unit: "ML",
    currentStock: 2800,
    minimumStock: 3000,
    costPerUnit: 18,
  },
  {
    id: "chicken-breast",
    name: "Chicken Breast",
    sku: "RST-ING-CHK-003",
    unit: "GRAM",
    currentStock: 6400,
    minimumStock: 2500,
    costPerUnit: 65,
  },
  {
    id: "rice",
    name: "Steamed Rice",
    sku: "RST-ING-RICE-004",
    unit: "GRAM",
    currentStock: 9000,
    minimumStock: 4000,
    costPerUnit: 18,
  },
  {
    id: "chocolate-syrup",
    name: "Chocolate Syrup",
    sku: "RST-ING-CHOC-005",
    unit: "ML",
    currentStock: 450,
    minimumStock: 700,
    costPerUnit: 24,
  },
  {
    id: "takeaway-cup",
    name: "Takeaway Cup 12oz",
    sku: "RST-PKG-CUP-006",
    unit: "PCS",
    currentStock: 120,
    minimumStock: 50,
    costPerUnit: 800,
  },
];

const menuItems: MenuSeed[] = [
  {
    id: "hot-latte",
    name: "Hot Latte",
    categoryId: "coffee",
    description: "Espresso with steamed milk.",
    price: 32000,
    isAvailable: true,
    recipes: [
      { inventoryId: "arabica-beans", quantityNeeded: 18 },
      { inventoryId: "fresh-milk", quantityNeeded: 180 },
    ],
  },
  {
    id: "iced-mocha",
    name: "Iced Mocha",
    categoryId: "coffee",
    description: "Chocolate espresso over ice.",
    price: 38000,
    isAvailable: true,
    recipes: [
      { inventoryId: "arabica-beans", quantityNeeded: 18 },
      { inventoryId: "fresh-milk", quantityNeeded: 140 },
      { inventoryId: "chocolate-syrup", quantityNeeded: 35 },
    ],
  },
  {
    id: "chicken-rice-bowl",
    name: "Chicken Rice Bowl",
    categoryId: "main-course",
    description: "Grilled chicken with steamed rice.",
    price: 56000,
    isAvailable: true,
    recipes: [
      { inventoryId: "chicken-breast", quantityNeeded: 160 },
      { inventoryId: "rice", quantityNeeded: 220 },
    ],
  },
  {
    id: "chocolate-pudding",
    name: "Chocolate Pudding",
    categoryId: "dessert",
    description: "Chilled chocolate pudding cup.",
    price: 24000,
    isAvailable: true,
    recipes: [{ inventoryId: "chocolate-syrup", quantityNeeded: 45 }],
  },
  {
    id: "sparkling-water",
    name: "Sparkling Water",
    categoryId: "beverage",
    description: "Cold sparkling mineral water.",
    price: 18000,
    isAvailable: true,
    recipes: [],
  },
];

const tables: TableSeed[] = [
  { id: "table-01", name: "T-01", capacity: 2, status: "OCCUPIED" },
  { id: "table-02", name: "T-02", capacity: 4, status: "AVAILABLE" },
  { id: "table-03", name: "T-03", capacity: 4, status: "OCCUPIED" },
  { id: "table-04", name: "T-04", capacity: 6, status: "CLEANING" },
  { id: "table-05", name: "T-05", capacity: 2, status: "RESERVED" },
];

const orders: OrderSeed[] = [
  {
    id: "pending-payment-01",
    orderNumber: 91001,
    tableId: "table-01",
    type: "DINE_IN",
    status: "PENDING_PAYMENT",
    paymentMethod: "CASH",
    createdMinutesAgo: 12,
    items: [
      { menuId: "hot-latte", quantity: 2 },
      { menuId: "chocolate-pudding", quantity: 1 },
    ],
  },
  {
    id: "paid-kitchen-01",
    orderNumber: 91002,
    tableId: "table-03",
    type: "DINE_IN",
    status: "PAID",
    paymentMethod: "QRIS",
    createdMinutesAgo: 21,
    items: [
      { menuId: "chicken-rice-bowl", quantity: 2 },
      { menuId: "iced-mocha", quantity: 1 },
    ],
  },
  {
    id: "preparing-01",
    orderNumber: 91003,
    type: "TAKEAWAY",
    status: "PREPARING",
    paymentMethod: "CARD",
    createdMinutesAgo: 18,
    items: [
      { menuId: "iced-mocha", quantity: 2 },
      { menuId: "sparkling-water", quantity: 2 },
    ],
  },
  {
    id: "ready-serving-01",
    orderNumber: 91004,
    tableId: "table-01",
    type: "DINE_IN",
    status: "READY",
    paymentMethod: "QRIS",
    createdMinutesAgo: 32,
    items: [
      { menuId: "chicken-rice-bowl", quantity: 1 },
      { menuId: "hot-latte", quantity: 1 },
    ],
  },
  {
    id: "served-01",
    orderNumber: 91005,
    tableId: "table-03",
    type: "DINE_IN",
    status: "SERVED",
    paymentMethod: "CASH",
    createdMinutesAgo: 48,
    items: [
      { menuId: "chocolate-pudding", quantity: 2 },
      { menuId: "sparkling-water", quantity: 2 },
    ],
  },
  {
    id: "completed-today-01",
    orderNumber: 91006,
    type: "TAKEAWAY",
    status: "COMPLETED",
    paymentMethod: "QRIS",
    createdMinutesAgo: 90,
    items: [
      { menuId: "hot-latte", quantity: 1 },
      { menuId: "chicken-rice-bowl", quantity: 1 },
    ],
  },
];

function scopedId(businessId: string, seedId: string) {
  return `restaurant-${businessId}-${seedId}`;
}

function paymentAccount(paymentMethod: OrderSeed["paymentMethod"]) {
  if (paymentMethod === "QRIS") return "QRIS";
  if (paymentMethod === "CARD") return "CARD";
  return "CASH";
}

function paymentStatus(orderStatus: OrderSeed["status"]) {
  return orderStatus === "PENDING_PAYMENT" ? "PENDING" : "PAID";
}

function shouldCreateCashflow(orderStatus: OrderSeed["status"]) {
  return orderStatus !== "PENDING_PAYMENT";
}

function orderCreatedAt(order: OrderSeed) {
  return new Date(Date.now() - order.createdMinutesAgo * 60_000);
}

async function seedRestaurantProfile(businessId: string) {
  await prisma.$executeRaw`
    INSERT INTO "Restaurant" (
      "id", "businessId", "address", "phone", "taxRate", "serviceRate", "currency", "orderPrefix", "receiptFooter", "timezone", "qrisEnabled", "cashEnabled", "cardEnabled"
    )
    VALUES (
      ${scopedId(businessId, "profile")},
      ${businessId},
      'Jl. Demo Restaurant No. 17',
      '+62-812-0000-1717',
      11,
      5,
      'IDR',
      'RST',
      'Thank you for dining with us.',
      'Asia/Jakarta',
      TRUE,
      TRUE,
      TRUE
    )
    ON CONFLICT ("businessId") DO UPDATE SET
      "address" = EXCLUDED."address",
      "phone" = EXCLUDED."phone",
      "taxRate" = EXCLUDED."taxRate",
      "serviceRate" = EXCLUDED."serviceRate",
      "currency" = EXCLUDED."currency",
      "orderPrefix" = EXCLUDED."orderPrefix",
      "receiptFooter" = EXCLUDED."receiptFooter",
      "timezone" = EXCLUDED."timezone",
      "qrisEnabled" = EXCLUDED."qrisEnabled",
      "cashEnabled" = EXCLUDED."cashEnabled",
      "cardEnabled" = EXCLUDED."cardEnabled"
  `;
}

async function seedCategory(businessId: string, category: CategorySeed) {
  await prisma.$executeRaw`
    INSERT INTO "Category" ("id", "businessId", "name")
    VALUES (${scopedId(businessId, category.id)}, ${businessId}, ${category.name})
    ON CONFLICT ("businessId", "name") DO NOTHING
  `;
}

async function seedInventoryItem(businessId: string, inventory: InventorySeed) {
  await prisma.$executeRaw`
    INSERT INTO "InventoryItem" (
      "id", "businessId", "name", "sku", "type", "unit", "currentStock", "minimumStock", "costPerUnit", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, inventory.id)},
      ${businessId},
      ${inventory.name},
      ${inventory.sku},
      'INGREDIENT'::"InventoryType",
      ${inventory.unit}::"InventoryUnit",
      ${inventory.currentStock},
      ${inventory.minimumStock},
      ${inventory.costPerUnit},
      NOW()
    )
    ON CONFLICT ("businessId", "name") DO UPDATE SET
      "sku" = EXCLUDED."sku",
      "type" = EXCLUDED."type",
      "unit" = EXCLUDED."unit",
      "currentStock" = EXCLUDED."currentStock",
      "minimumStock" = EXCLUDED."minimumStock",
      "costPerUnit" = EXCLUDED."costPerUnit",
      "updatedAt" = NOW()
  `;
}

async function seedMenuItem(businessId: string, menu: MenuSeed) {
  const categoryId = scopedId(businessId, menu.categoryId);

  await prisma.$executeRaw`
    INSERT INTO "MenuItem" (
      "id", "businessId", "categoryId", "name", "description", "price", "isAvailable", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, menu.id)},
      ${businessId},
      ${categoryId},
      ${menu.name},
      ${menu.description},
      ${menu.price},
      ${menu.isAvailable},
      NOW()
    )
    ON CONFLICT ("id") DO UPDATE SET
      "categoryId" = EXCLUDED."categoryId",
      "name" = EXCLUDED."name",
      "description" = EXCLUDED."description",
      "price" = EXCLUDED."price",
      "isAvailable" = EXCLUDED."isAvailable",
      "updatedAt" = NOW()
  `;

  for (const recipe of menu.recipes) {
    await prisma.$executeRaw`
      INSERT INTO "Recipe" ("id", "menuItemId", "inventoryItemId", "quantityNeeded")
      VALUES (
        ${scopedId(businessId, `${menu.id}-${recipe.inventoryId}-recipe`)},
        ${scopedId(businessId, menu.id)},
        ${scopedId(businessId, recipe.inventoryId)},
        ${recipe.quantityNeeded}
      )
      ON CONFLICT ("menuItemId", "inventoryItemId") DO UPDATE SET
        "quantityNeeded" = EXCLUDED."quantityNeeded"
    `;
  }
}

async function seedTable(businessId: string, table: TableSeed) {
  await prisma.$executeRaw`
    INSERT INTO "DiningTable" (
      "id", "businessId", "name", "capacity", "status", "isActive", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, table.id)},
      ${businessId},
      ${table.name},
      ${table.capacity},
      ${table.status}::"TableStatus",
      TRUE,
      NOW()
    )
    ON CONFLICT ("id") DO UPDATE SET
      "name" = EXCLUDED."name",
      "capacity" = EXCLUDED."capacity",
      "status" = EXCLUDED."status",
      "isActive" = TRUE,
      "updatedAt" = NOW()
  `;
}

function calculateOrderTotals(order: OrderSeed) {
  const menuPriceById = new Map(menuItems.map((menu) => [menu.id, menu.price]));
  const subtotal = order.items.reduce((total, item) => {
    const price = menuPriceById.get(item.menuId) ?? 0;
    return total + price * item.quantity;
  }, 0);
  const taxAmount = Math.round(subtotal * 0.11);
  const serviceAmount = Math.round(subtotal * 0.05);
  const total = subtotal + taxAmount + serviceAmount;

  return {
    subtotal,
    taxAmount,
    serviceAmount,
    total,
  };
}

async function seedOrder(businessId: string, order: OrderSeed) {
  const orderId = scopedId(businessId, order.id);
  const tableId = order.tableId ? scopedId(businessId, order.tableId) : null;
  const createdAt = orderCreatedAt(order);
  const totals = calculateOrderTotals(order);
  const paid = paymentStatus(order.status) === "PAID";

  await prisma.$executeRaw`
    INSERT INTO "Order" (
      "id", "businessId", "orderNumber", "subtotal", "taxAmount", "serviceAmount", "total", "paymentMethod",
      "amountPaid", "changeAmount", "status", "inventoryDeducted", "tableId", "type", "createdAt", "updatedAt"
    )
    VALUES (
      ${orderId},
      ${businessId},
      ${order.orderNumber},
      ${totals.subtotal},
      ${totals.taxAmount},
      ${totals.serviceAmount},
      ${totals.total},
      ${order.paymentMethod},
      ${paid ? totals.total : 0},
      0,
      ${order.status}::"OrderStatus",
      ${paid},
      ${tableId},
      ${order.type}::"OrderType",
      ${createdAt},
      NOW()
    )
    ON CONFLICT ("businessId", "orderNumber") DO UPDATE SET
      "subtotal" = EXCLUDED."subtotal",
      "taxAmount" = EXCLUDED."taxAmount",
      "serviceAmount" = EXCLUDED."serviceAmount",
      "total" = EXCLUDED."total",
      "paymentMethod" = EXCLUDED."paymentMethod",
      "amountPaid" = EXCLUDED."amountPaid",
      "changeAmount" = EXCLUDED."changeAmount",
      "status" = EXCLUDED."status",
      "inventoryDeducted" = EXCLUDED."inventoryDeducted",
      "tableId" = EXCLUDED."tableId",
      "type" = EXCLUDED."type",
      "createdAt" = EXCLUDED."createdAt",
      "updatedAt" = NOW()
  `;

  const orderRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Order" WHERE "businessId" = ${businessId} AND "orderNumber" = ${order.orderNumber} LIMIT 1
  `;
  const persistedOrderId = orderRows[0]?.id ?? orderId;

  await prisma.$executeRaw`DELETE FROM "OrderItem" WHERE "orderId" = ${persistedOrderId}`;

  for (const item of order.items) {
    const menu = menuItems.find((candidate) => candidate.id === item.menuId);

    if (!menu) {
      continue;
    }

    await prisma.$executeRaw`
      INSERT INTO "OrderItem" (
        "id", "orderId", "menuItemId", "quantity", "price", "subtotal"
      )
      VALUES (
        ${scopedId(businessId, `${order.id}-${item.menuId}-item`)},
        ${persistedOrderId},
        ${scopedId(businessId, item.menuId)},
        ${item.quantity},
        ${menu.price},
        ${menu.price * item.quantity}
      )
    `;
  }

  await prisma.$executeRaw`
    INSERT INTO "Payment" (
      "id", "orderId", "provider", "method", "status", "paidAt", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, `${order.id}-payment`)},
      ${persistedOrderId},
      'manual',
      ${order.paymentMethod},
      ${paymentStatus(order.status)}::"PaymentStatus",
      ${paid ? createdAt : null},
      NOW()
    )
    ON CONFLICT ("orderId") DO UPDATE SET
      "provider" = EXCLUDED."provider",
      "method" = EXCLUDED."method",
      "status" = EXCLUDED."status",
      "paidAt" = EXCLUDED."paidAt",
      "updatedAt" = NOW()
  `;

  if (!shouldCreateCashflow(order.status)) {
    await prisma.$executeRaw`
      DELETE FROM "CashflowEntry"
      WHERE "businessId" = ${businessId}
        AND "sourceType" = 'ORDER_PAYMENT'::"CashflowSourceType"
        AND "sourceId" = ${persistedOrderId}
    `;
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO "CashflowEntry" (
      "id", "businessId", "type", "account", "amount", "status", "occurredAt", "title", "description",
      "sourceType", "sourceId", "reference", "createdAt", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, `${order.id}-cashflow`)},
      ${businessId},
      'INCOME'::"CashflowEntryType",
      ${paymentAccount(order.paymentMethod)}::"CashflowAccount",
      ${totals.total},
      'POSTED'::"CashflowEntryStatus",
      ${createdAt},
      ${`Restaurant Order #${order.orderNumber}`},
      'Seeded restaurant order payment.',
      'ORDER_PAYMENT'::"CashflowSourceType",
      ${persistedOrderId},
      ${`RST-${order.orderNumber}`},
      NOW(),
      NOW()
    )
    ON CONFLICT ("id") DO UPDATE SET
      "amount" = EXCLUDED."amount",
      "account" = EXCLUDED."account",
      "status" = EXCLUDED."status",
      "occurredAt" = EXCLUDED."occurredAt",
      "title" = EXCLUDED."title",
      "description" = EXCLUDED."description",
      "sourceType" = EXCLUDED."sourceType",
      "sourceId" = EXCLUDED."sourceId",
      "reference" = EXCLUDED."reference",
      "updatedAt" = NOW()
  `;
}

async function seedBusiness(business: BusinessSeedTarget) {
  await seedRestaurantProfile(business.id);

  for (const category of categories) {
    await seedCategory(business.id, category);
  }

  for (const inventory of inventoryItems) {
    await seedInventoryItem(business.id, inventory);
  }

  for (const menu of menuItems) {
    await seedMenuItem(business.id, menu);
  }

  for (const table of tables) {
    await seedTable(business.id, table);
  }

  for (const order of orders) {
    await seedOrder(business.id, order);
  }

  console.log(
    `Seeded restaurant demo data for ${business.name} (${business.id}): ${categories.length} categories, ${inventoryItems.length} inventory items, ${menuItems.length} menu items, ${tables.length} tables, ${orders.length} orders.`,
  );
}

async function main() {
  const businesses = await prisma.business.findMany({
    where: {
      mode: "RESTAURANT",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (businesses.length === 0) {
    console.log("No active RESTAURANT business found. Create/select a Restaurant business first.");
    return;
  }

  for (const business of businesses) {
    await seedBusiness(business);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
