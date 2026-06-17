/*
  Warnings:

  - You are about to drop the column `approvalStatus` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `Service` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_providerId_fkey";

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "approvalStatus",
DROP COLUMN "providerId";

-- CreateTable
CREATE TABLE "ProviderService" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "basePricePerDay" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "providerServiceRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderServiceRequest" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "requestedServiceName" TEXT NOT NULL,
    "basePricePerDay" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "popularIssues" JSONB NOT NULL DEFAULT '[]',
    "experienceYears" INTEGER,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProviderServiceToProviderServiceRequest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ProviderServiceToProviderServiceRequest_AB_unique" ON "_ProviderServiceToProviderServiceRequest"("A", "B");

-- CreateIndex
CREATE INDEX "_ProviderServiceToProviderServiceRequest_B_index" ON "_ProviderServiceToProviderServiceRequest"("B");

-- AddForeignKey
ALTER TABLE "ProviderService" ADD CONSTRAINT "ProviderService_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderService" ADD CONSTRAINT "ProviderService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderServiceRequest" ADD CONSTRAINT "ProviderServiceRequest_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProviderServiceToProviderServiceRequest" ADD CONSTRAINT "_ProviderServiceToProviderServiceRequest_A_fkey" FOREIGN KEY ("A") REFERENCES "ProviderService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProviderServiceToProviderServiceRequest" ADD CONSTRAINT "_ProviderServiceToProviderServiceRequest_B_fkey" FOREIGN KEY ("B") REFERENCES "ProviderServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
