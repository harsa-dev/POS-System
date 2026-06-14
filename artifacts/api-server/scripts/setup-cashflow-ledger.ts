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
      "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
      "sourceType" "CashflowSourceType" NOT NULL DEFAULT 'MANUAL',
      "sourceId" TEXT NULL,
      "idempotencyKey" TEXT NULL,
      "account" "CashflowAccount" NOT NULL DEFAULT 'CASH',
      "type" "CashflowEntryType" NOT NULL,
      "status" "CashflowEntryStatus" NOT NULL DEFAULT 'POSTED',
      "category" TEXT NOT NULL DEFAULT 'General',
      "counterpartyName" TEXT NULL,
      "description" TEXT NULL,
      "amount" INTEGER NOT NULL,
      "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "postedAt" TIMESTAMPTZ NULL,
      "voidedAt" TIMESTAMPTZ NULL,
      "createdById" TEXT NULL REFERENCES "User"("id") ON DELETE SET NULL,
      "metadata" JSONB NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CashflowEntry"
      ADD COLUMN IF NOT EXISTS "businessId" TEXT NULL,
      ADD COLUMN IF NOT EXISTS "sourceType" "CashflowSourceType" NOT NULL DEFAULT 'MANUAL',
      ADD COLUMN IF NOT EXISTS "sourceId" TEXT NULL,
      ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT NULL,
      ADD COLUMN IF NOT EXISTS "account" "CashflowAccount" NOT NULL DEFAULT 'CASH',
      ADD COLUMN IF NOT EXISTS "status" "CashflowEntryStatus" NOT NULL DEFAULT 'POSTED',
      ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'General',
      ADD COLUMN IF NOT EXISTS "counterpartyName" TEXT NULL,
      ADD COLUMN IF NOT EXISTS "description" TEXT NULL,
      ADD COLUMN IF NOT EXISTS "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "postedAt" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "voidedAt" TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS "createdById" TEXT NULL,
      ADD COLUMN IF NOT EXISTS "metadata" JSONB NULL,
      ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now();
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'CashflowEntry'
          AND column_name = 'restaurantId'
      ) THEN
        UPDATE "CashflowEntry" entry
        SET "businessId" = restaurant."businessId"
        FROM "Restaurant" restaurant
        WHERE entry."businessId" IS NULL
          AND entry."restaurantId" IS NOT NULL
          AND entry."restaurantId" = restaurant."id";
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'CashflowEntry'
          AND column_name = 'title'
      ) THEN
        EXECUTE '
          UPDATE "CashflowEntry"
          SET "category" = COALESCE(NULLIF("title", ''''), NULLIF("category", ''''), ''General'')
        ';
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'CashflowEntry'
          AND column_name = 'restaurantId'
      ) THEN
        ALTER TABLE "CashflowEntry" ALTER COLUMN "restaurantId" DROP NOT NULL;
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'CashflowEntry_businessId_fkey'
      ) THEN
        ALTER TABLE "CashflowEntry"
          ADD CONSTRAINT "CashflowEntry_businessId_fkey"
          FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE;
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CashflowEntry"
      DROP CONSTRAINT IF EXISTS "CashflowEntry_restaurantId_idempotencyKey_key";
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'CashflowEntry_businessId_idempotencyKey_key'
      ) THEN
        ALTER TABLE "CashflowEntry"
          ADD CONSTRAINT "CashflowEntry_businessId_idempotencyKey_key"
          UNIQUE ("businessId", "idempotencyKey");
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM "CashflowEntry"
        WHERE "businessId" IS NULL
      ) THEN
        ALTER TABLE "CashflowEntry" ALTER COLUMN "businessId" SET NOT NULL;
      ELSE
        RAISE NOTICE 'CashflowEntry.businessId still has NULL rows; leaving column nullable until data is repaired.';
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_businessId_idx" ON "CashflowEntry" ("businessId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_type_idx" ON "CashflowEntry" ("type");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_status_idx" ON "CashflowEntry" ("status");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_occurredAt_idx" ON "CashflowEntry" ("occurredAt");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_sourceType_idx" ON "CashflowEntry" ("sourceType");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_sourceId_idx" ON "CashflowEntry" ("sourceId");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_businessId_type_idx" ON "CashflowEntry" ("businessId", "type");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_businessId_status_idx" ON "CashflowEntry" ("businessId", "status");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_businessId_sourceType_idx" ON "CashflowEntry" ("businessId", "sourceType");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CashflowEntry_businessId_account_idx" ON "CashflowEntry" ("businessId", "account");`);
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
