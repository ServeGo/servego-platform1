import prisma from '../prisma/client.js';
import { isProviderSlotTaken } from '../services/bookingAvailabilityService.js';
import { sendApiError } from '../utils/response.js';

// NOTE: This project currently stores provider working pattern as JSON
// fields on Provider: availableDays + timeSlots.
// This controller derives "blocked/busy" status in real-time from Booking table.

function normalizeDowInput(day) {
  if (!day) return null;
  const d = String(day).trim().toLowerCase();
  const map = {
    mon: 'Mon',
    monday: 'Mon',
    tue: 'Tue',
    tues: 'Tue',
    tuesday: 'Tue',
    wed: 'Wed',
    wednesday: 'Wed',
    thu: 'Thu',
    thur: 'Thu',
    thurs: 'Thu',
    thursday: 'Thu',
    fri: 'Fri',
    friday: 'Fri',
    sat: 'Sat',
    saturday: 'Sat',
    sun: 'Sun',
    sunday: 'Sun',
  };
  return map[d] || null;
}

function dayOfWeekShort(date) {
  // 0=Sun..6=Sat
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

export const ProviderAvailabilityController = {
  // GET /providers/:id/availability?date=YYYY-MM-DD
  // Returns computed slots with busy=true/false based on existing bookings.
  getAvailabilityForDate: async (req, res) => {
    try {
      const providerId = req.params.id;
      const { date } = req.query;

      if (!date) return sendApiError(res, 400, 'MISSING_FIELDS', 'Query param "date" is required (YYYY-MM-DD).');

      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) {
        return sendApiError(res, 400, 'INVALID_DATE', 'Invalid date query param.');
      }

      // Normalize to local date boundaries for consistent day comparisons
      const dayStart = new Date(parsed);
      dayStart.setHours(0, 0, 0, 0);

      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        select: { availableDays: true, timeSlots: true },
      });

      if (!provider) return sendApiError(res, 404, 'NOT_FOUND', 'Provider not found.');

      const dow = dayOfWeekShort(dayStart);
      const providerDays = Array.isArray(provider.availableDays) ? provider.availableDays : [];

      const normalizedProviderDays = providerDays
        .map(normalizeDowInput)
        .filter(Boolean);

      const isWorkingDay = normalizedProviderDays.includes(dow);

      if (!isWorkingDay) {
        return res.json({
          providerId,
          date,
          isWorkingDay: false,
          slots: [],
        });
      }

      // timeSlots is currently stored as JSON on Provider.
      // If empty/undefined, default to 1 placeholder "Flexible" slot.
      const rawSlots = Array.isArray(provider.timeSlots) ? provider.timeSlots : [];
      const slots = rawSlots.length ? rawSlots : ['Flexible'];

      // Compute busy per slot in "real-time" from bookings.
      // This uses the existing isProviderSlotTaken logic which unblocks automatically
      // once booking status is COMPLETED/CANCELLED.
      const slotResults = await Promise.all(
        slots.map(async (slot) => {
          const busy = await isProviderSlotTaken(providerId, dayStart, slot);
          return { slot, busy };
        })
      );

      return res.json({
        providerId,
        date,
        isWorkingDay: true,
        slots: slotResults,
      });
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to compute provider availability', err.message);
    }
  },
};

