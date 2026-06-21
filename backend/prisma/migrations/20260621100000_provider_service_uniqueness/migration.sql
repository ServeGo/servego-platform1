-- Remove duplicate approved service links before enforcing uniqueness.
-- Keeps the oldest row for each provider/service pair.
DELETE FROM "ProviderService" ps
USING "ProviderService" duplicate
WHERE ps."providerId" = duplicate."providerId"
  AND ps."serviceId" = duplicate."serviceId"
  AND ps."createdAt" > duplicate."createdAt";

-- If the same request created more than one ProviderService, keep the oldest row.
DELETE FROM "ProviderService" ps
USING "ProviderService" duplicate
WHERE ps."providerServiceRequestId" IS NOT NULL
  AND duplicate."providerServiceRequestId" IS NOT NULL
  AND ps."providerServiceRequestId" = duplicate."providerServiceRequestId"
  AND ps."createdAt" > duplicate."createdAt";

-- Handle exact timestamp ties by keeping the first row per duplicate group.
DELETE FROM "ProviderService" ps
USING (
  SELECT ctid
  FROM (
    SELECT ctid,
           ROW_NUMBER() OVER (
             PARTITION BY "providerId", "serviceId"
             ORDER BY "createdAt", "id"
           ) AS row_number
    FROM "ProviderService"
  ) ranked
  WHERE ranked.row_number > 1
) duplicate
WHERE ps.ctid = duplicate.ctid;

DELETE FROM "ProviderService" ps
USING (
  SELECT ctid
  FROM (
    SELECT ctid,
           ROW_NUMBER() OVER (
             PARTITION BY "providerServiceRequestId"
             ORDER BY "createdAt", "id"
           ) AS row_number
    FROM "ProviderService"
    WHERE "providerServiceRequestId" IS NOT NULL
  ) ranked
  WHERE ranked.row_number > 1
) duplicate
WHERE ps.ctid = duplicate.ctid;

-- CreateIndex
CREATE UNIQUE INDEX "ProviderService_providerId_serviceId_key" ON "ProviderService"("providerId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderService_providerServiceRequestId_key" ON "ProviderService"("providerServiceRequestId");
