/*
  Warnings:

  - You are about to drop the column `invoiceNumber` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `serviceFee` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `earnings` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `basePricePerDay` on the `ProviderService` table. All the data in the column will be lost.
  - You are about to drop the column `basePricePerDay` on the `ProviderServiceRequest` table. All the data in the column will be lost.
  - You are about to drop the column `basePrice` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "invoiceNumber",
DROP COLUMN "serviceFee",
DROP COLUMN "tax",
DROP COLUMN "totalAmount";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "amount",
DROP COLUMN "currency";

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "earnings",
DROP COLUMN "hourlyRate";

-- AlterTable
ALTER TABLE "ProviderService" DROP COLUMN "basePricePerDay";

-- AlterTable
ALTER TABLE "ProviderServiceRequest" DROP COLUMN "basePricePerDay";

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "basePrice";
