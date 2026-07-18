-- A customer can submit one review for a completed booking.  PostgreSQL
-- permits multiple NULLs in a unique index, so reviews not tied to a booking
-- remain supported while booking reviews are enforced at the database level.
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");
