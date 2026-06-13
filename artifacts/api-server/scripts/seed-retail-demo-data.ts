import { prisma } from "../src/lib/prisma.js";

type SupplierSeed = {
  id: string;
  name: string;
  leadTimeDays: number;
  reliabilityScore: number;
};

type ProductSeed = {
  id: string;
  supplierId: string;
  sku: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  price: number;
  cost: number;
  taxRatePercent: number;
  currentStock: number;
  reorderPoint: number;
  shelfLocation: string;
};

const suppliers: SupplierSeed[] = [
  {
    id: "daily-goods-wholesale",
    name: "Daily Goods Wholesale",
    leadTimeDays: 2,
    reliabilityScore: 94,
  },
  {
    id: "freshmart-distribution",
    name: "FreshMart Distribution",
    leadTimeDays: 3,
    reliabilityScore: 91,
  },
  {
    id: "household-supply-co",
    name: "Household Supply Co",
    leadTimeDays: 5,
    reliabilityScore: 88,
  },
];

const products: ProductSeed[] = [
  {
    id: "sea-salt-potato-chips",
    supplierId: "daily-goods-wholesale",
    sku: "RTL-CHIPS-001",
    barcode: "8991001000011",
    name: "Sea Salt Potato Chips",
    brand: "CrispyCo",
    category: "snacks",
    unit: "pcs",
    price: 18000,
    cost: 10500,
    taxRatePercent: 11,
    currentStock: 42,
    reorderPoint: 12,
    shelfLocation: "A1-01",
  },
  {
    id: "cold-brew-coffee-250ml",
    supplierId: "freshmart-distribution",
    sku: "RTL-DRINK-002",
    barcode: "8991001000028",
    name: "Cold Brew Coffee 250ml",
    brand: "NorthCup",
    category: "beverages",
    unit: "bottle",
    price: 22000,
    cost: 13500,
    taxRatePercent: 11,
    currentStock: 9,
    reorderPoint: 10,
    shelfLocation: "B2-03",
  },
  {
    id: "liquid-dish-soap-450ml",
    supplierId: "household-supply-co",
    sku: "RTL-HOME-003",
    barcode: "8991001000035",
    name: "Liquid Dish Soap 450ml",
    brand: "CleanNest",
    category: "household",
    unit: "bottle",
    price: 17000,
    cost: 9800,
    taxRatePercent: 11,
    currentStock: 0,
    reorderPoint: 8,
    shelfLocation: "C1-04",
  },
  {
    id: "premium-rice-5kg",
    supplierId: "daily-goods-wholesale",
    sku: "RTL-RICE-004",
    barcode: "8991001000042",
    name: "Premium Rice 5kg",
    brand: "HarvestGold",
    category: "staples",
    unit: "bag",
    price: 78000,
    cost: 64000,
    taxRatePercent: 0,
    currentStock: 16,
    reorderPoint: 6,
    shelfLocation: "D3-01",
  },
  {
    id: "mineral-water-600ml",
    supplierId: "freshmart-distribution",
    sku: "RTL-DRINK-005",
    barcode: "8991001000059",
    name: "Mineral Water 600ml",
    brand: "ClearSpring",
    category: "beverages",
    unit: "bottle",
    price: 6000,
    cost: 3200,
    taxRatePercent: 11,
    currentStock: 120,
    reorderPoint: 30,
    shelfLocation: "B1-01",
  },
  {
    id: "instant-noodle-chicken",
    supplierId: "daily-goods-wholesale",
    sku: "RTL-NOODLE-006",
    barcode: "8991001000066",
    name: "Instant Noodle Chicken",
    brand: "WarmBowl",
    category: "staples",
    unit: "pack",
    price: 4500,
    cost: 2900,
    taxRatePercent: 11,
    currentStock: 84,
    reorderPoint: 24,
    shelfLocation: "D1-02",
  },
];

function scopedId(businessId: string, seedId: string) {
  return `retail-${businessId}-${seedId}`;
}

async function seedSupplier(businessId: string, supplier: SupplierSeed) {
  await prisma.$executeRaw`
    INSERT INTO "RetailSupplier" (
      "id", "businessId", "name", "leadTimeDays", "reliabilityScore", "isActive", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, supplier.id)},
      ${businessId},
      ${supplier.name},
      ${supplier.leadTimeDays},
      ${supplier.reliabilityScore},
      TRUE,
      NOW()
    )
    ON CONFLICT ("businessId", "name") DO UPDATE SET
      "leadTimeDays" = EXCLUDED."leadTimeDays",
      "reliabilityScore" = EXCLUDED."reliabilityScore",
      "isActive" = TRUE,
      "updatedAt" = NOW()
  `;
}

async function seedProduct(businessId: string, product: ProductSeed) {
  await prisma.$executeRaw`
    INSERT INTO "RetailProduct" (
      "id", "businessId", "supplierId", "sku", "barcode", "name", "brand", "category", "unit",
      "price", "cost", "taxRatePercent", "currentStock", "reorderPoint", "shelfLocation", "isActive", "updatedAt"
    )
    VALUES (
      ${scopedId(businessId, product.id)},
      ${businessId},
      ${scopedId(businessId, product.supplierId)},
      ${product.sku},
      ${product.barcode},
      ${product.name},
      ${product.brand},
      ${product.category},
      ${product.unit},
      ${product.price},
      ${product.cost},
      ${product.taxRatePercent},
      ${product.currentStock},
      ${product.reorderPoint},
      ${product.shelfLocation},
      TRUE,
      NOW()
    )
    ON CONFLICT ("businessId", "sku") DO UPDATE SET
      "supplierId" = EXCLUDED."supplierId",
      "barcode" = EXCLUDED."barcode",
      "name" = EXCLUDED."name",
      "brand" = EXCLUDED."brand",
      "category" = EXCLUDED."category",
      "unit" = EXCLUDED."unit",
      "price" = EXCLUDED."price",
      "cost" = EXCLUDED."cost",
      "taxRatePercent" = EXCLUDED."taxRatePercent",
      "currentStock" = EXCLUDED."currentStock",
      "reorderPoint" = EXCLUDED."reorderPoint",
      "shelfLocation" = EXCLUDED."shelfLocation",
      "isActive" = TRUE,
      "updatedAt" = NOW()
  `;
}

async function main() {
  const businesses = await prisma.business.findMany({
    where: {
      mode: "RETAIL",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (businesses.length === 0) {
    console.log("No active RETAIL business found. Create/select a Retail business first.");
    return;
  }

  for (const business of businesses) {
    for (const supplier of suppliers) {
      await seedSupplier(business.id, supplier);
    }

    for (const product of products) {
      await seedProduct(business.id, product);
    }

    console.log(
      `Seeded ${suppliers.length} suppliers and ${products.length} products for ${business.name} (${business.id}).`,
    );
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
