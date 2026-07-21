import { BookingRepository } from '../repositories/booking.repository.js';
import { parseCalendarDate } from '../utils/availability.js';

const GENERIC_SLOTS = new Set(['flexible', 'ongoing']);

/**
 * Returns true if the provider already has an active booking
 * for the exact same specific time slot on the same date.
 * Generic slot types (Contract, Permanent, Flexible) are skipped
 * because multiple bookings of those types are valid.
 */
export async function isProviderSlotTaken(providerId, bookingDate, bookingTimeSlot, tx) {
  if (!bookingTimeSlot || GENERIC_SLOTS.has(String(bookingTimeSlot).trim().toLowerCase())) {
    return false;
  }

  const dayStart = parseCalendarDate(bookingDate);
  dayStart.setHours(0, 0, 0, 0);

  const conflict = await BookingRepository.findSlotConflict(providerId, dayStart, bookingTimeSlot, tx);
  return conflict !== null;
}
