import prisma from '../prisma/client.js';
import { parseCalendarDate } from '../utils/availability.js';

// Generic slot labels that are not real time slots — skip conflict check for these.
// These labels must be treated as real blocking slots for the
// real-time booking behavior (so the provider becomes busy immediately).
// If you keep a label here, the backend will allow multiple bookings
// for that label.
const GENERIC_SLOTS = new Set(['flexible', 'ongoing']);


/**
 * Returns true if the provider already has an active booking
 * for the exact same specific time slot on the same date.
 * Generic slot types (Contract, Permanent, Flexible) are skipped
 * because multiple bookings of those types are valid.
 */
export async function isProviderSlotTaken(providerId, bookingDate, bookingTimeSlot, db = prisma) {
  if (!bookingTimeSlot || GENERIC_SLOTS.has(String(bookingTimeSlot).trim().toLowerCase())) {
    return false;
  }

  const dayStart = parseCalendarDate(bookingDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = parseCalendarDate(bookingDate);
  dayEnd.setHours(23, 59, 59, 999);

  const conflict = await db.booking.findFirst({
    where: {
      providerId,
      bookingTimeSlot,
      bookingDate: { gte: dayStart, lte: dayEnd },
      status: { in: ['PENDING', 'CONFIRMED', 'ONGOING'] }
    },
    select: { id: true }
  });

  return conflict !== null;
}
