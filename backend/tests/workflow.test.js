import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidBookingTransition, normalizeBookingStatus, normalizePaymentStatus } from '../utils/workflow.js';

test('allows standard booking lifecycle transitions', () => {
  assert.equal(isValidBookingTransition('PENDING', 'CONFIRMED'), true);
  assert.equal(isValidBookingTransition('CONFIRMED', 'ONGOING'), true);
  assert.equal(isValidBookingTransition('ONGOING', 'COMPLETED'), true);
  assert.equal(isValidBookingTransition('PENDING', 'CANCELLED'), true);
});

test('rejects invalid booking transition', () => {
  assert.equal(isValidBookingTransition('COMPLETED', 'CANCELLED'), false);
  assert.equal(isValidBookingTransition('CANCELLED', 'CONFIRMED'), false);
});

test('normalizes statuses consistently', () => {
  assert.equal(normalizeBookingStatus('pending'), 'PENDING');
  assert.equal(normalizePaymentStatus('paid'), 'PAID');
  assert.equal(normalizePaymentStatus(undefined), 'PENDING');
});

test('maps legacy workflow aliases to canonical statuses', () => {
  assert.equal(normalizeBookingStatus('en_route'), 'ONGOING');
  assert.equal(normalizeBookingStatus('in_progress'), 'ONGOING');
  assert.equal(normalizeBookingStatus('reviewed'), 'COMPLETED');
});
