const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const normalizeDay = (value) => {
  const day = String(value || '').trim().toLowerCase();
  const aliases = {
    mon: 'Mon', monday: 'Mon', tue: 'Tue', tues: 'Tue', tuesday: 'Tue',
    wed: 'Wed', wednesday: 'Wed', thu: 'Thu', thur: 'Thu', thurs: 'Thu', thursday: 'Thu',
    fri: 'Fri', friday: 'Fri', sat: 'Sat', saturday: 'Sat', sun: 'Sun', sunday: 'Sun'
  };
  return aliases[day] || null;
};

export function parseCalendarDate(date) {
  if (date instanceof Date) return new Date(date);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ''));
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(date);
}

export function isProviderAvailableForSlot(provider, date, slot) {
  const bookingDate = parseCalendarDate(date);
  if (Number.isNaN(bookingDate.getTime())) return false;

  const day = DAY_NAMES[bookingDate.getDay()];
  const availableDays = Array.isArray(provider.availableDays) ? provider.availableDays : [];
  if (!availableDays.map(normalizeDay).includes(day)) return false;

  const requestedSlot = String(slot || '').trim();
  if (!requestedSlot) return false;
  const configuredSlots = Array.isArray(provider.availabilitySlots) ? provider.availabilitySlots : [];
  if (configuredSlots.length) {
    return configuredSlots.some((configured) =>
      normalizeDay(configured.dayOfWeek) === day && `${configured.startTime}-${configured.endTime}` === requestedSlot
    );
  }

  const legacySlots = Array.isArray(provider.timeSlots) ? provider.timeSlots : [];
  return legacySlots.includes(requestedSlot);
}
