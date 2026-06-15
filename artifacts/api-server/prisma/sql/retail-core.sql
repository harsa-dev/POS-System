-- Retail core scoped database setup for Business Mode: Retail.
-- This file is intentionally executed through prisma db execute, not Prisma migrate history.
-- It uses idempotent DDL so local/demo databases can be repaired without replaying a broken global migration chain.

CREATE TABLE IF NOT EXISTS "RetailSupplier" (
  "id" TEXT PRIMARY KEY,
  "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "leadTimeDays" INTEGER NOT NULL DEFAULT 0,
  "reliabilityScore" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "RetailSupplier_businessId_name_key" ON "RetailSupplier"("businessId", "name");
CREATE INDEX IF NOT EXISTS "RetailSupplier_businessId_idx" ON "RetailSupplier"("businessId");
CREATE INDEX IF NOT EXISTS "RetailSupplier_isActive_idx" ON "RetailSupplier"("isActive");

CREATE TABLE IF NOT EXISTS "RetailProduct" (
  "id" TEXT PRIMARY KEY,
  "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "supplierId" TEXT REFERENCES "RetailSupplier"("id") ON DELETE SET NULL,
  "sku" TEXT NOT NULL,
  "barcode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "brand" TEXT NOT NULL DEFAULT '',
  "category" TEXT NOT NULL DEFAULT 'general',
  "unit" TEXT NOT NULL DEFAULT 'pcs',
  "price" INTEGER NOT NULL DEFAULT 0,
  "cost" INTEGER NOT NULL DEFAULT 0,
  "taxRatePercent" INTEGER NOT NULL DEFAULT 0,
  "currentStock" INTEGER NOT NULL DEFAULT 0,
  "reorderPoint" INTEGER NOT NULL DEFAULT 0,
  "shelfLocation" TEXT NOT NULL DEFAULT '',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "RetailProduct_businessId_sku_key" ON "RetailProduct"("businessId", "sku");
CREATE UNIQUE INDEX IF NOT EXISTS "RetailProduct_businessId_barcode_key" ON "RetailProduct"("businessId", "barcode");
CREATE INDEX IF NOT EXISTS "RetailProduct_businessId_idx" ON "RetailProduct"("businessId");
CREATE INDEX IF NOT EXISTS "RetailProduct_supplierId_idx" ON "RetailProduct"("supplierId");
CREATE INDEX IF NOT EXISTS "RetailProduct_category_idx" ON "RetailProduct"("category");
CREATE INDEX IF NOT EXISTS "RetailProduct_currentStock_idx" ON "RetailProduct"("currentStock");
CREATE INDEX IF NOT EXISTS "RetailProduct_reorderPoint_idx" ON "RetailProduct"("reorderPoint");
CREATE INDEX IF NOT EXISTS "RetailProduct_isActive_idx" ON "RetailProduct"("isActive");

CREATE TABLE IF NOT EXISTS "RetailReceiving" (
  "id" TEXT PRIMARY KEY,
  "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "supplierId" TEXT NOT NULL REFERENCES "RetailSupplier"("id"),
  "referenceNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ordered',
  "expectedDate" TIMESTAMPTZ NOT NULL,
  "receivedAt" TIMESTAMPTZ,
  "totalCost" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "RetailReceiving_businessId_referenceNumber_key" ON "RetailReceiving"("businessId", "referenceNumber");
CREATE INDEX IF NOT EXISTS "RetailReceiving_businessId_idx" ON "RetailReceiving"("businessId");
CREATE INDEX IF NOT EXISTS "RetailReceiving_supplierId_idx" ON "RetailReceiving"("supplierId");
CREATE INDEX IF NOT EXISTS "RetailReceiving_status_idx" ON "RetailReceiving"("status");
CREATE INDEX IF NOT EXISTS "RetailReceiving_expectedDate_idx" ON "RetailReceiving"("expectedDate");

CREATE TABLE IF NOT EXISTS "RetailReceivingItem" (
  "id" TEXT PRIMARY KEY,
  "receivingId" TEXT NOT NULL REFERENCES "RetailReceiving"("id") ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "RetailProduct"("id"),
  "orderedQty" INTEGER NOT NULL DEFAULT 0,
  "receivedQty" INTEGER NOT NULL DEFAULT 0,
  "unitCost" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "RetailReceivingItem_receivingId_idx" ON "RetailReceivingItem"("receivingId");
CREATE INDEX IF NOT EXISTS "RetailReceivingItem_productId_idx" ON "RetailReceivingItem"("productId");

CREATE TABLE IF NOT EXISTS "RetailSale" (
  "id" TEXT PRIMARY KEY,
  "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "createdById" TEXT NOT NULL REFERENCES "User"("id"),
  "receiptNumber" TEXT NOT NULL,
  "paymentMethod" TEXT NOT NULL,
  "subtotal" INTEGER NOT NULL DEFAULT 0,
  "discountTotal" INTEGER NOT NULL DEFAULT 0,
  "taxIncluded" INTEGER NOT NULL DEFAULT 0,
  "total" INTEGER NOT NULL DEFAULT 0,
  "grossProfit" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "RetailSale_businessId_receiptNumber_key" ON "RetailSale"("businessId", "receiptNumber");
CREATE INDEX IF NOT EXISTS "RetailSale_businessId_idx" ON "RetailSale"("businessId");
CREATE INDEX IF NOT EXISTS "RetailSale_createdById_idx" ON "RetailSale"("createdById");
CREATE INDEX IF NOT EXISTS "RetailSale_paymentMethod_idx" ON "RetailSale"("paymentMethod");
CREATE INDEX IF NOT EXISTS "RetailSale_status_idx" ON "RetailSale"("status");
CREATE INDEX IF NOT EXISTS "RetailSale_createdAt_idx" ON "RetailSale"("createdAt");

CREATE TABLE IF NOT EXISTS "RetailSaleItem" (
  "id" TEXT PRIMARY KEY,
  "saleId" TEXT NOT NULL REFERENCES "RetailSale"("id") ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "RetailProduct"("id"),
  "skuSnapshot" TEXT NOT NULL,
  "nameSnapshot" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" INTEGER NOT NULL,
  "costSnapshot" INTEGER NOT NULL,
  "subtotal" INTEGER NOT NULL,
  "discountAmount" INTEGER NOT NULL DEFAULT 0,
  "taxIncluded" INTEGER NOT NULL DEFAULT 0,
  "lineTotal" INTEGER NOT NULL,
  "grossProfit" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "RetailSaleItem_saleId_idx" ON "RetailSaleItem"("saleId");
CREATE INDEX IF NOT EXISTS "RetailSaleItem_productId_idx" ON "RetailSaleItem"("productId");

CREATE TABLE IF NOT EXISTS "RetailPayment" (
  "id" TEXT PRIMARY KEY,
  "saleId" TEXT NOT NULL UNIQUE REFERENCES "RetailSale"("id") ON DELETE CASCADE,
  "provider" TEXT NOT NULL DEFAULT 'manual',
  "method" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'paid',
  "amount" INTEGER NOT NULL DEFAULT 0,
  "paidAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "RetailPayment_method_idx" ON "RetailPayment"("method");
CREATE INDEX IF NOT EXISTS "RetailPayment_status_idx" ON "RetailPayment"("status");

CREATE TABLE IF NOT EXISTS "RetailStockMovement" (
  "id" TEXT PRIMARY KEY,
  "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "productId" TEXT NOT NULL REFERENCES "RetailProduct"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "sourceId" TEXT,
  "quantity" INTEGER NOT NULL,
  "beforeQuantity" INTEGER NOT NULL,
  "afterQuantity" INTEGER NOT NULL,
  "note" TEXT,
  "createdById" TEXT REFERENCES "User"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "RetailStockMovement_businessId_idx" ON "RetailStockMovement"("businessId");
CREATE INDEX IF NOT EXISTS "RetailStockMovement_productId_idx" ON "RetailStockMovement"("productId");
CREATE INDEX IF NOT EXISTS "RetailStockMovement_type_idx" ON "RetailStockMovement"("type");
CREATE INDEX IF NOT EXISTS "RetailStockMovement_reason_idx" ON "RetailStockMovement"("reason");
CREATE INDEX IF NOT EXISTS "RetailStockMovement_source_idx" ON "RetailStockMovement"("source");
CREATE INDEX IF NOT EXISTS "RetailStockMovement_createdAt_idx" ON "RetailStockMovement"("createdAt");
