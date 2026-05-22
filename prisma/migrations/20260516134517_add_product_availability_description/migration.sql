-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true;
