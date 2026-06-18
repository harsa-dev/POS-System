import { createRequire } from "module";

const req = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = req("@prisma/client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaPg } = req("@prisma/adapter-pg");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pg = req("pg");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const RETAIL_BIZ_ID = "biz-demo-retail";

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcrypt" + "js");
  return bcrypt.default.hash(password, 12);
}

async function main() {
  console.log("Seeding retail demo data…");

  const passwordHash = await hashPassword("password123");

  await prisma.business.upsert({
    where: { id: RETAIL_BIZ_ID },
    update: {},
    create: {
      id: RETAIL_BIZ_ID,
      name: "Demo Minimart",
      mode: "retail",
      currency: "IDR",
      timezone: "Asia/Jakarta",
    },
  });
  console.log("✓ Business biz-demo-retail upserted.");

  await prisma.user.upsert({
    where: { email: "retail@test.com" },
    update: {},
    create: {
      businessId: RETAIL_BIZ_ID,
      email: "retail@test.com",
      passwordHash,
      role: "OWNER",
      name: "Retail Owner",
    },
  });

  await prisma.user.upsert({
    where: { email: "retail.manager@test.com" },
    update: {},
    create: {
      businessId: RETAIL_BIZ_ID,
      email: "retail.manager@test.com",
      passwordHash,
      role: "MANAGER",
      name: "Retail Manager",
    },
  });
  console.log("✓ Users seeded (retail@test.com, retail.manager@test.com).");

  const products = [
    {
      id: "prod-retail-001",
      businessId: RETAIL_BIZ_ID,
      sku: "SKU-INDOMIE-001",
      barcode: "8999999001234",
      name: "Indomie Goreng",
      brand: "Indomie",
      category: "Instant Noodles",
      unit: "pcs",
      price: 3500,
      cost: 2200,
      taxRatePercent: 11,
      currentStock: 150,
      reorderPoint: 50,
      shelfLocation: "A1-01",
      status: "in-stock",
    },
    {
      id: "prod-retail-002",
      businessId: RETAIL_BIZ_ID,
      sku: "SKU-AQUA-001",
      barcode: "8999999002345",
      name: "Aqua 600ml",
      brand: "Danone",
      category: "Beverages",
      unit: "btl",
      price: 5000,
      cost: 3000,
      taxRatePercent: 11,
      currentStock: 200,
      reorderPoint: 60,
      shelfLocation: "B1-01",
      status: "in-stock",
    },
    {
      id: "prod-retail-003",
      businessId: RETAIL_BIZ_ID,
      sku: "SKU-CHITATO-001",
      barcode: "8999999003456",
      name: "Chitato Sapi Panggang 68g",
      brand: "Indofood",
      category: "Snacks",
      unit: "pcs",
      price: 12000,
      cost: 8000,
      taxRatePercent: 11,
      currentStock: 40,
      reorderPoint: 30,
      shelfLocation: "A2-01",
      status: "low-stock",
    },
    {
      id: "prod-retail-004",
      businessId: RETAIL_BIZ_ID,
      sku: "SKU-ULTRAMILK-001",
      barcode: "8999999004567",
      name: "Ultra Milk Full Cream 250ml",
      brand: "Ultra",
      category: "Dairy",
      unit: "pcs",
      price: 6500,
      cost: 4500,
      taxRatePercent: 11,
      currentStock: 5,
      reorderPoint: 20,
      shelfLocation: "C1-01",
      status: "low-stock",
    },
    {
      id: "prod-retail-005",
      businessId: RETAIL_BIZ_ID,
      sku: "SKU-GOODDAY-001",
      barcode: "8999999005678",
      name: "Good Day Cappuccino 250ml",
      brand: "Santos Jaya",
      category: "Beverages",
      unit: "can",
      price: 7500,
      cost: 5000,
      taxRatePercent: 11,
      currentStock: 0,
      reorderPoint: 24,
      shelfLocation: "B2-01",
      status: "out-of-stock",
    },
    {
      id: "prod-retail-006",
      businessId: RETAIL_BIZ_ID,
      sku: "SKU-BIMOLI-001",
      barcode: "8999999006789",
      name: "Bimoli Minyak Goreng 2L",
      brand: "Salim Ivomas",
      category: "Cooking Oil",
      unit: "btl",
      price: 42000,
      cost: 32000,
      taxRatePercent: 11,
      currentStock: 80,
      reorderPoint: 20,
      shelfLocation: "D1-01",
      status: "in-stock",
    },
  ];

  for (const product of products) {
    await prisma.retailProduct.upsert({
      where: { id: product.id },
      update: { currentStock: product.currentStock },
      create: product,
    });
  }
  console.log(`✓ ${products.length} RetailProduct records upserted.`);

  const suppliers = [
    {
      id: "sup-retail-001",
      businessId: RETAIL_BIZ_ID,
      name: "PT Indofood Distributor",
      contactName: "Budi Santoso",
      contactEmail: "budi@indofood-dist.co.id",
      contactPhone: "+62-21-5550001",
      leadTimeDays: 3,
      reliabilityScore: 92,
    },
    {
      id: "sup-retail-002",
      businessId: RETAIL_BIZ_ID,
      name: "CV Danone Jaya",
      contactName: "Siti Rahayu",
      contactEmail: "siti@danonejmkt.co.id",
      contactPhone: "+62-21-5550002",
      leadTimeDays: 2,
      reliabilityScore: 95,
    },
    {
      id: "sup-retail-003",
      businessId: RETAIL_BIZ_ID,
      name: "UD Maju Bersama",
      contactName: "Ahmad Ridwan",
      contactEmail: "ahmad@majubersama.co.id",
      contactPhone: "+62-21-5550003",
      leadTimeDays: 5,
      reliabilityScore: 78,
    },
  ];

  for (const supplier of suppliers) {
    await prisma.retailSupplier.upsert({
      where: { id: supplier.id },
      update: {},
      create: supplier,
    });
  }
  console.log(`✓ ${suppliers.length} RetailSupplier records upserted.`);

  await prisma.retailPromotion.deleteMany({ where: { businessId: RETAIL_BIZ_ID } });

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await prisma.retailPromotion.createMany({
    data: [
      {
        businessId: RETAIL_BIZ_ID,
        name: "Ramadan Discount",
        description: "Seasonal discount on all beverage products during Ramadan.",
        discountPercent: 15,
        targetCategory: "Beverages",
        startsAt: now,
        endsAt: in30Days,
        isActive: true,
      },
      {
        businessId: RETAIL_BIZ_ID,
        name: "Snacks Flash Sale",
        description: "Flash sale on snack category — limited to 2 weeks.",
        discountPercent: 10,
        targetCategory: "Snacks",
        startsAt: now,
        endsAt: in14Days,
        isActive: true,
      },
      {
        businessId: RETAIL_BIZ_ID,
        name: "Dairy Clearance",
        description: "Clearance discount for near-expiry dairy products.",
        discountPercent: 20,
        targetCategory: "Dairy",
        startsAt: yesterday,
        endsAt: in14Days,
        isActive: false,
      },
      {
        businessId: RETAIL_BIZ_ID,
        name: "Year-End Mega Sale",
        description: "Storewide promotion for the year-end shopping season.",
        discountPercent: 25,
        targetCategory: "",
        startsAt: in30Days,
        endsAt: in60Days,
        isActive: false,
      },
    ],
  });
  console.log("✓ 4 RetailPromotion records seeded.");

  console.log("\nRetail seed complete.");
  console.log("  Login: retail@test.com / password123  (OWNER)");
  console.log("  Login: retail.manager@test.com / password123  (MANAGER)");
}

main()
  .catch((err) => {
    console.error("Retail seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
