import test from 'node:test';
import assert from 'node:assert/strict';
import { isProviderAvailableForSlot, parseCalendarDate } from '../utils/availability.js';

const provider = {
  availableDays: ['Mon', 'Wed'],
  availabilitySlots: [
    { dayOfWeek: 'Mon', startTime: '09:00', endTime: '12:00' },
    { dayOfWeek: 'Mon', startTime: '14:00', endTime: '17:00' }
  ],
  timeSlots: []
};

test('uses calendar dates without UTC day shifting', () => {
  const date = parseCalendarDate('2026-07-20');
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 6);
  assert.equal(date.getDate(), 20);
});

test('only permits a provider configured working-day slot', () => {
  assert.equal(isProviderAvailableForSlot(provider, '2026-07-20', '09:00-12:00'), true);
  assert.equal(isProviderAvailableForSlot(provider, '2026-07-20', '12:00-14:00'), false);
  assert.equal(isProviderAvailableForSlot(provider, '2026-07-21', '09:00-12:00'), false);
});
