-- Backfill: populate requestedServiceId using requestedServiceName normalization
-- and ensure nameNormalized exists for Services.

-- 1) Populate Service.nameNormalized where missing (best-effort)
UPDATE "Service"
SET "nameNormalized" = LOWER(TRIM("name"))
WHERE "nameNormalized" IS NULL AND "name" IS NOT NULL;

-- 2) Populate ProviderServiceRequest.requestedServiceId by matching Service.nameNormalized
UPDATE "ProviderServiceRequest" psr
SET "requestedServiceId" = s.id
FROM "Service" s
WHERE psr."requestedServiceId" IS NULL
  AND psr."requestedServiceName" IS NOT NULL
  AND s."nameNormalized" = LOWER(TRIM(psr."requestedServiceName"));

