-- Retail return scoped database setup and refund reversal support.
-- This file is intentionally executed through prisma db execute, not Prisma migrate history.

CREATE TABLE IF NOT EXISTS "RetailReturn" (
  "id" TEXT PRIMARY KEY,
  "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "saleId" TEXT NOT NULL REFERENCES "RetailSale"("id") ON DELETE CASCADE,
  "createdById" TEXT NOT NULL REFERENCES "User"("id"),
  "returnNumber" TEXT NOT NULL,
  "originalReceiptNumber" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "refundAmount" INTEGER NOT NULL DEFAULT 0,
  "restockedQuantity" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "RetailReturn_businessId_returnNumber_key" ON "RetailReturn"("businessId", "returnNumber");
CREATE INDEX IF NOT EXISTS "RetailReturn_businessId_idx" ON "RetailReturn"("businessId");
CREATE INDEX IF NOT EXISTS "RetailReturn_saleId_idx" ON "RetailReturn"("saleId");
CREATE INDEX IF NOT EXISTS "RetailReturn_createdById_idx" ON "RetailReturn"("createdById");
CREATE INDEX IF NOT EXISTS "RetailReturn_reason_idx" ON "RetailReturn"("reason");
CREATE INDEX IF NOT EXISTS "RetailReturn_status_idx" ON "RetailReturn"("status");
CREATE INDEX IF NOT EXISTS "RetailReturn_createdAt_idx" ON "RetailReturn"("createdAt");

CREATE TABLE IF NOT EXISTS "RetailReturnItem" (
  "id" TEXT PRIMARY KEY,
  "returnId" TEXT NOT NULL REFERENCES "RetailReturn"("id") ON DELETE CASCADE,
  "saleItemId" TEXT NOT NULL REFERENCES "RetailSaleItem"("id"),
  "productId" TEXT NOT NULL REFERENCES "RetailProduct"("id"),
  "skuSnapshot" TEXT NOT NULL,
  "nameSnapshot" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "refundAmount" INTEGER NOT NULL DEFAULT 0,
  "restockable" BOOLEAN NOT NULL DEFAULT FALSE,
  "restockedQuantity" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "RetailReturnItem_returnId_idx" ON "RetailReturnItem"("returnId");
CREATE INDEX IF NOT EXISTS "RetailReturnItem_saleItemId_idx" ON "RetailReturnItem"("saleItemId");
CREATE INDEX IF NOT EXISTS "RetailReturnItem_productId_idx" ON "RetailReturnItem"("productId");
CREATE INDEX IF NOT EXISTS "RetailReturnItem_restockable_idx" ON "RetailReturnItem"("restockable");
