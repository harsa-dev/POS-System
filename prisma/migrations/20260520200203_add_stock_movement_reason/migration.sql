/*
  Warnings:

  - You are about to drop the `InventoryTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StockMovementReason" AS ENUM ('PURCHASE', 'RECIPE_USAGE', 'WASTE', 'EXPIRED', 'MANUAL_ADJUSTMENT', 'DAMAGED');

-- DropForeignKey
ALTER TABLE "InventoryTransaction" DROP CONSTRAINT "InventoryTransaction_inventoryItemId_fkey";

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "reason" "StockMovementReason";

-- DropTable
DROP TABLE "InventoryTransaction";

-- DropEnum
DROP TYPE "InventoryTransactionType";
