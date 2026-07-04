import prisma from '../prisma/client.js';

// Generic slot labels that are not real time slots — skip conflict check for these.
const GENERIC_SLOTS = new Set(['flexible', 'contract', 'permanent', 'ongoing']);

/**
 * Returns true if the provider already has an active booking
 * for the exact same specific time slot on the same date.
 * Generic slot types (Contract, Permanent, Flexible) are skipped
 * because multiple bookings of those types are valid.
 */
export async function isProviderSlotTaken(providerId, bookingDate, bookingTimeSlot) {
  if (!bookingTimeSlot || GENERIC_SLOTS.has(String(bookingTimeSlot).trim().toLowerCase())) {
    return false;
  }

  const dayStart = new Date(bookingDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(bookingDate);
  dayEnd.setHours(23, 59, 59, 999);

  const conflict = await prisma.booking.findFirst({
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
