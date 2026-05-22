-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "autoPrint" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'IDR',
ADD COLUMN     "orderPrefix" TEXT NOT NULL DEFAULT 'ORD',
ADD COLUMN     "receiptFooter" TEXT DEFAULT 'Thank you for your order.',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Makassar';
