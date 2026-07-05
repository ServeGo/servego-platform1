-- Migration: fix nameNormalized backfill to avoid unique constraint violations.
-- We only set nameNormalized for Services where it is currently NULL AND
-- we can guarantee the normalized value maps to exactly one Service row.

-- If duplicate normalized names exist, we leave those rows' nameNormalized as NULL
-- (admin Step 2/3 logic will still work because requestedServiceId will be backfilled by exact match where possible).

WITH normalized AS (
  SELECT
    id,
    LOWER(TRIM(name)) AS nn
  FROM "Service"
  WHERE "nameNormalized" IS NULL
    AND name IS NOT NULL
),
counts AS (
  SELECT nn, COUNT(*)::int AS c
  FROM normalized
  GROUP BY nn
)
UPDATE "Service" s
SET "nameNormalized" = n.nn
FROM normalized n
JOIN counts c ON c.nn = n.nn
WHERE s.id = n.id
  AND s."nameNormalized" IS NULL
  AND c.c = 1;

-- Backfill requestedServiceId using Services that already have a non-null nameNormalized
UPDATE "ProviderServiceRequest" psr
SET "requestedServiceId" = s.id
FROM "Service" s
WHERE psr."requestedServiceId" IS NULL
  AND psr."requestedServiceName" IS NOT NULL
  AND s."nameNormalized" IS NOT NULL
  AND s."nameNormalized" = LOWER(TRIM(psr."requestedServiceName"));
