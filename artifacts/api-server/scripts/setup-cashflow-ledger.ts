import { prisma } from "../src/lib/prisma.js";

async function main() {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "CashflowEntryType" AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "CashflowEntryStatus" AS ENUM ('PENDING', 'POSTED', 'VOIDED');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "CashflowAccount" AS ENUM ('CASH', 'BANK', 'QRIS', 'CARD', 'TRANSFER', 'OTHER');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "CashflowSourceType" AS ENUM ('ORDER_PAYMENT', 'PAYMENT_WEBHOOK', 'SHIFT_CLOSE', 'INVOICE', 'MANUAL', 'INVENTORY_PURCHASE', 'REFUND', 'SYSTEM');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "CashflowEntry" (
      "id" TEXT PRIMARY KEY,
      "businessId" TEXT NULL REFERENCES "Business"("id") ON DELETE SET NULL,
      "restaurantId" TEXT NOT NULL REFERENCES "Restaurant"("id") ON DELETE CASCADE,
      "sourceType" "CashflowSourceType" NOT NULL,
      "sourceId" TEXT NULL,
      "idempotencyKey" TEXT NULL,
      "account" "CashflowAccount" NOT NULL,
      "type" "CashflowEntryType" NOT NULL,
      "status" "CashflowEntryStatus" NOT NULL DEFAULT 'POSTED',
      "category" TEXT NOT NULL,
      "counterpartyName" TEXT NULL,
      "description" TEXT NULL,
      "amount" INTEGER NOT NULL,
      "occurredAt" TIMESTAMPTZ NOT NULL,
      "postedAt" TIMESTAMPTZ NULL,
      "voidedAt" TIMESTAMPTZ NULL,
      "createdById" TEXT NULL REFERENCES "User"("id") ON DELETE SET NULL,
      "metadata" JSONB NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT "CashflowEntry_restaurantId_idempotencyKey_key" UNIQUE ("restaurantId", "idempotencyKey")
    );
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_businessId_idx" ON "CashflowEntry" ("businessId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_restaurantId_idx" ON "CashflowEntry" ("restaurantId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_restaurantId_occurredAt_idx" ON "CashflowEntry" ("restaurantId", "occurredAt");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_restaurantId_type_idx" ON "CashflowEntry" ("restaurantId", "type");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_restaurantId_status_idx" ON "CashflowEntry" ("restaurantId", "status");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_restaurantId_sourceType_idx" ON "CashflowEntry" ("restaurantId", "sourceType");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_restaurantId_account_idx" ON "CashflowEntry" ("restaurantId", "account");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_sourceType_sourceId_idx" ON "CashflowEntry" ("sourceType", "sourceId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_createdById_idx" ON "CashflowEntry" ("createdById");`);

  console.log("Cashflow ledger setup finished.");
}

main()
  .catch((error) => {
    console.error("Cashflow ledger setup failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
