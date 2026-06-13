import { createRequire } from "module";
const req = createRequire(import.meta.url);
const { PrismaClient } = req("@prisma/client");
const { PrismaPg } = req("@prisma/adapter-pg");
const pg = req("pg");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashDemoPassword(value: string) {
  const hasher = await import("bcrypt" + "js");
  return hasher.default.hash(value, 12);
}

async function main() {
  console.log("Seeding database...");

  const passwordHash = await hashDemoPassword("password123");

  const owner = await prisma.user.upsert({
    where: { email: "owner@test.com" },
    update: {},
    create: { name: "Demo Owner", email: "owner@test.com", passwordHash, role: "OWNER", isActive: true },
  });

  const business = await prisma.business.upsert({
    where: { id: "biz-demo-restaurant" },
    update: {},
    create: {
      id: "biz-demo-restaurant",
      name: "Demo Restaurant",
      ownerId: owner.id,
      type: "RESTAURANT",
      mode: "RESTAURANT",
      restaurant: { create: { address: "Jl. Demo No. 1, Jakarta", phone: "08123456789", taxRate: 10, serviceRate: 5 } },
    },
  });

  await prisma.user.update({ where: { id: owner.id }, data: { businessId: business.id } });

  await Promise.all([
    prisma.category.upsert({ where: { id: "cat-food" }, update: {}, create: { id: "cat-food", name: "Food", businessId: business.id } }),
    prisma.category.upsert({ where: { id: "cat-drink" }, update: {}, create: { id: "cat-drink", name: "Drinks", businessId: business.id } }),
    prisma.category.upsert({ where: { id: "cat-snack" }, update: {}, create: { id: "cat-snack", name: "Snacks", businessId: business.id } }),
  ]);

  const menuItems = [
    { id: "mi-nasi-goreng", name: "Nasi Goreng", price: 35000, categoryId: "cat-food", description: "Fried rice with egg and vegetables" },
    { id: "mi-mie-goreng", name: "Mie Goreng", price: 30000, categoryId: "cat-food", description: "Fried noodles with vegetables" },
    { id: "mi-ayam-bakar", name: "Ayam Bakar", price: 45000, categoryId: "cat-food", description: "Grilled chicken with sambal" },
    { id: "mi-soto-ayam", name: "Soto Ayam", price: 28000, categoryId: "cat-food", description: "Indonesian chicken soup" },
    { id: "mi-es-teh", name: "Es Teh Manis", price: 8000, categoryId: "cat-drink", description: "Iced sweet tea" },
    { id: "mi-es-jeruk", name: "Es Jeruk", price: 10000, categoryId: "cat-drink", description: "Iced orange juice" },
    { id: "mi-kopi-hitam", name: "Kopi Hitam", price: 12000, categoryId: "cat-drink", description: "Black coffee" },
    { id: "mi-air-mineral", name: "Air Mineral", price: 5000, categoryId: "cat-drink", description: "Mineral water" },
    { id: "mi-kerupuk", name: "Kerupuk", price: 5000, categoryId: "cat-snack", description: "Indonesian crackers" },
    { id: "mi-tempe-goreng", name: "Tempe Goreng", price: 8000, categoryId: "cat-snack", description: "Fried tempeh" },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, businessId: business.id, isAvailable: true },
    });
  }

  const tables = [
    { id: "tbl-1", name: "Meja 1", capacity: 4 },
    { id: "tbl-2", name: "Meja 2", capacity: 4 },
    { id: "tbl-3", name: "Meja 3", capacity: 2 },
    { id: "tbl-4", name: "Meja 4", capacity: 6 },
    { id: "tbl-5", name: "Meja 5", capacity: 2 },
    { id: "tbl-6", name: "Meja VIP", capacity: 8 },
  ];

  for (const table of tables) {
    await prisma.diningTable.upsert({
      where: { id: table.id },
      update: {},
      create: { ...table, businessId: business.id, status: "AVAILABLE", isActive: true },
    });
  }

  const inventoryItems = [
    { id: "inv-beras", name: "Beras", sku: "BERAS-001", type: "INGREDIENT", unit: "KILOGRAM", currentStock: 50, minimumStock: 10 },
    { id: "inv-minyak", name: "Minyak Goreng", sku: "MINYAK-001", type: "INGREDIENT", unit: "LITER", currentStock: 20, minimumStock: 5 },
    { id: "inv-ayam", name: "Ayam", sku: "AYAM-001", type: "INGREDIENT", unit: "KILOGRAM", currentStock: 15, minimumStock: 3 },
    { id: "inv-teh", name: "Teh Celup", sku: "TEH-001", type: "INGREDIENT", unit: "PACK", currentStock: 30, minimumStock: 5 },
    { id: "inv-gula", name: "Gula Pasir", sku: "GULA-001", type: "INGREDIENT", unit: "KILOGRAM", currentStock: 10, minimumStock: 2 },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, businessId: business.id },
    });
  }

  const manager = await prisma.user.upsert({
    where: { email: "manager@test.com" },
    update: {},
    create: { name: "Demo Manager", email: "manager@test.com", passwordHash, role: "MANAGER", businessId: business.id, isActive: true },
  });

  const operator = await prisma.user.upsert({
    where: { email: "operator@test.com" },
    update: {},
    create: { name: "Demo Operator", email: "operator@test.com", passwordHash, role: "OPERATOR", businessId: business.id, isActive: true },
  });

  const recipes = [
    { menuItemId: "mi-nasi-goreng", inventoryItemId: "inv-beras", quantityNeeded: 0.2 },
    { menuItemId: "mi-nasi-goreng", inventoryItemId: "inv-minyak", quantityNeeded: 0.05 },
    { menuItemId: "mi-mie-goreng", inventoryItemId: "inv-minyak", quantityNeeded: 0.05 },
    { menuItemId: "mi-ayam-bakar", inventoryItemId: "inv-ayam", quantityNeeded: 0.3 },
    { menuItemId: "mi-ayam-bakar", inventoryItemId: "inv-minyak", quantityNeeded: 0.02 },
    { menuItemId: "mi-soto-ayam", inventoryItemId: "inv-ayam", quantityNeeded: 0.2 },
    { menuItemId: "mi-es-teh", inventoryItemId: "inv-teh", quantityNeeded: 0.01 },
    { menuItemId: "mi-es-teh", inventoryItemId: "inv-gula", quantityNeeded: 0.02 },
  ];

  for (const recipe of recipes) {
    await prisma.recipe.upsert({
      where: { menuItemId_inventoryItemId: { menuItemId: recipe.menuItemId, inventoryItemId: recipe.inventoryItemId } },
      update: {},
      create: recipe,
    });
  }

  for (const user of [owner, manager, operator]) {
    const existingShift = await prisma.shift.findFirst({ where: { userId: user.id, businessId: business.id, status: "OPEN" } });
    if (!existingShift) {
      await prisma.shift.create({ data: { userId: user.id, businessId: business.id, status: "OPEN", openedAt: new Date(), openingCash: 0, expectedCash: 0 } });
    }
  }

  console.log("Seed complete:");
  console.log(`  Business: ${business.name} (id: ${business.id})`);
  console.log(`  Owner: ${owner.email} (businessId: ${business.id})`);
  console.log(`  Manager: ${manager.email}`);
  console.log(`  Operator: ${operator.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
