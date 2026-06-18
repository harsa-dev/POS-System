-- Add stock-level snapshot fields to StockMovement.
-- These capture the inventory quantity before and after a movement
-- so that movement history is self-contained and does not require
-- recalculating from the movement sequence.
ALTER TABLE "StockMovement"
  ADD COLUMN IF NOT EXISTS "previousStock"    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "newStock"         DOUBLE PRECISION;

-- Add cost snapshot fields to StockMovement.
-- unitCostSnapshot stores the per-unit cost at the moment the movement
-- was created, enabling historically accurate COGS without relying on
-- the current mutable InventoryItem.costPerUnit value.
-- totalCostSnapshot = ABS(quantity) * unitCostSnapshot, stored for
-- reporting efficiency.
ALTER TABLE "StockMovement"
  ADD COLUMN IF NOT EXISTS "unitCostSnapshot"  DECIMAL(65,30),
  ADD COLUMN IF NOT EXISTS "totalCostSnapshot" DECIMAL(65,30);

-- Index on unitCostSnapshot to speed up the cost-snapshot repair queries
-- that filter for movements where the snapshot IS NULL.
CREATE INDEX IF NOT EXISTS "StockMovement_unitCostSnapshot_idx"
  ON "StockMovement" ("unitCostSnapshot");
