-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'ELITE');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM ('TOP_RATED', 'FAST_RESPONSE', 'JOBS_100', 'RELIABLE_PROVIDER', 'MULTI_SERVICE_EXPERT', 'CUSTOMER_FAVORITE', 'ELITE_PROVIDER');

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'BRONZE';

-- AlterTable
ALTER TABLE "Review" ADD COLUMN "reviewerName" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN "nameNormalized" TEXT;

UPDATE "Service"
SET "nameNormalized" = lower(trim("name"))
WHERE "nameNormalized" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Service_nameNormalized_key" ON "Service"("nameNormalized");

-- CreateTable
CREATE TABLE "ProviderBadge" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "badgeType" "BadgeType" NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProviderBadge_providerId_badgeType_key" ON "ProviderBadge"("providerId", "badgeType");

-- AddForeignKey
ALTER TABLE "ProviderBadge" ADD CONSTRAINT "ProviderBadge_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
