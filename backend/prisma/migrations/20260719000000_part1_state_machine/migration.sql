-- Part 1: State Machine Schema Deltas
-- Adds: BookingEvent, AvailabilitySlot, DurationType enum, REJECTED to ApprovalStatus,
--       Booking cancellation/duration fields, ProviderServiceRequest reviewedBy/reviewedAt,
--       Notification.relatedBookingId, Ticket.userId + relatedBookingId

-- 1. New enums
CREATE TYPE "DurationType" AS ENUM ('CONTRACT', 'PERMANENT');

ALTER TYPE "ApprovalStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- 2. Booking: cancellation + duration + amount fields
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "cancelledBy"     TEXT,
  ADD COLUMN IF NOT EXISTS "cancelledReason" TEXT,
  ADD COLUMN IF NOT EXISTS "scheduledStart"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "durationType"    "DurationType" NOT NULL DEFAULT 'CONTRACT',
  ADD COLUMN IF NOT EXISTS "durationYears"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "durationDays"    INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "durationHours"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "amount"          DOUBLE PRECISION;

-- 3. BookingEvent (append-only audit trail)
CREATE TABLE IF NOT EXISTS "BookingEvent" (
  "id"        TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "actorRole" TEXT NOT NULL,
  "actorId"   TEXT,
  "action"    TEXT NOT NULL,
  "note"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BookingEvent_bookingId_idx" ON "BookingEvent"("bookingId");
CREATE INDEX IF NOT EXISTS "BookingEvent_createdAt_idx" ON "BookingEvent"("createdAt");

ALTER TABLE "BookingEvent"
  ADD CONSTRAINT "BookingEvent_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. AvailabilitySlot (structured time slots per provider per day)
CREATE TABLE IF NOT EXISTS "AvailabilitySlot" (
  "id"         TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "dayOfWeek"  TEXT NOT NULL,
  "startTime"  TEXT NOT NULL,
  "endTime"    TEXT NOT NULL,
  CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AvailabilitySlot_providerId_dayOfWeek_startTime_key"
  ON "AvailabilitySlot"("providerId", "dayOfWeek", "startTime");

CREATE INDEX IF NOT EXISTS "AvailabilitySlot_providerId_idx" ON "AvailabilitySlot"("providerId");

ALTER TABLE "AvailabilitySlot"
  ADD CONSTRAINT "AvailabilitySlot_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "Provider"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. ProviderServiceRequest: reviewedBy + reviewedAt
ALTER TABLE "ProviderServiceRequest"
  ADD COLUMN IF NOT EXISTS "reviewedBy"  TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt"  TIMESTAMP(3);

-- 6. Notification: relatedBookingId
ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "relatedBookingId" TEXT;

-- 7. Ticket: userId + relatedBookingId
ALTER TABLE "Ticket"
  ADD COLUMN IF NOT EXISTS "userId"           TEXT,
  ADD COLUMN IF NOT EXISTS "relatedBookingId" TEXT;

CREATE INDEX IF NOT EXISTS "Ticket_userId_idx" ON "Ticket"("userId");
