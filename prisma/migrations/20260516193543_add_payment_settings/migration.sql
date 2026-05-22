-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "cardEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cashEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "midtransEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qrisEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "transferEnabled" BOOLEAN NOT NULL DEFAULT false;
