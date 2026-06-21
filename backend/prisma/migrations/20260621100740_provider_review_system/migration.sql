-- AlterTable
ALTER TABLE "Provider" ALTER COLUMN "rating" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referralBonusEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "referredBy" TEXT;
