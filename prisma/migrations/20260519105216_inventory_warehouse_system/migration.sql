/*
  Warnings:

  - You are about to drop the column `stock` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `menuItemId` on the `StockMovement` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,restaurantId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inventoryItemId` to the `StockMovement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InventoryType" AS ENUM ('INGREDIENT', 'PACKAGING', 'EQUIPMENT');

-- CreateEnum
CREATE TYPE "InventoryUnit" AS ENUM ('PCS', 'GRAM', 'KILOGRAM', 'LITER', 'ML', 'PACK', 'BOTTLE');

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_menuItemId_fkey";

-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "stock";

-- AlterTable
ALTER TABLE "StockMovement" DROP COLUMN "menuItemId",
ADD COLUMN     "inventoryItemId" TEXT NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "type" "InventoryType" NOT NULL,
    "unit" "InventoryUnit" NOT NULL,
    "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimumStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPerUnit" INTEGER NOT NULL DEFAULT 0,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantityNeeded" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_restaurantId_name_key" ON "InventoryItem"("restaurantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_menuItemId_inventoryItemId_key" ON "Recipe"("menuItemId", "inventoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_restaurantId_key" ON "Category"("name", "restaurantId");

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
