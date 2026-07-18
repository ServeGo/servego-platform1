-- CreateEnum
CREATE TYPE "ProviderAccountStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'BLOCKED');

-- AlterTable: add accountStatus to Provider
ALTER TABLE "Provider" ADD COLUMN "accountStatus" "ProviderAccountStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable: SavedPro (customer favourites)
CREATE TABLE "SavedPro" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedPro_customerId_providerId_key" ON "SavedPro"("customerId", "providerId");
CREATE INDEX "SavedPro_customerId_idx" ON "SavedPro"("customerId");
CREATE INDEX "SavedPro_providerId_idx" ON "SavedPro"("providerId");

-- AddForeignKey
ALTER TABLE "SavedPro" ADD CONSTRAINT "SavedPro_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedPro" ADD CONSTRAINT "SavedPro_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
