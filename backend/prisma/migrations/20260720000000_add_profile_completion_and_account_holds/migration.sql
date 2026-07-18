-- Profile-completeness flags and user-level account holds/blocks.
-- Provider account status already uses ProviderAccountStatus; User.status is
-- the existing user-level account-status field and is extended in place.

ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'ON_HOLD';
ALTER TYPE "AccountStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "profileComplete" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Provider"
  ADD COLUMN IF NOT EXISTS "profileComplete" BOOLEAN NOT NULL DEFAULT false;
