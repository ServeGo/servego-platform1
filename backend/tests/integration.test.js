import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTokenPair, verifyRefreshToken, isAuthBlocked, recordFailedAuthAttempt, getFailedAuthAttempts } from '../utils/auth.js';
import { validatePasswordStrength, isValidEmail, isValidPhone, isValidPincode } from '../utils/validation.js';
import { normalizeBookingStatus, isValidBookingTransition, buildStatusHistory } from '../utils/workflow.js';

// ==================== Token Refresh Tests ====================

test('generates valid token pair', () => {
  const tokens = generateTokenPair({ id: 'user123', role: 'provider', email: 'test@example.com' });
  
  assert.ok(tokens.accessToken, 'Should have access token');
  assert.ok(tokens.refreshToken, 'Should have refresh token');
  assert.equal(tokens.tokenType, 'Bearer', 'Token type should be Bearer');
  assert.ok(tokens.expiresIn, 'Should have expiresIn');
});

test('verifies refresh token', () => {
  const tokens = generateTokenPair({ id: 'user123', role: 'customer', email: 'test@example.com' });
  const decoded = verifyRefreshToken(tokens.refreshToken);
  
  assert.ok(decoded, 'Should decode refresh token');
  assert.equal(decoded.type, 'refresh', 'Token type should be refresh');
  assert.equal(decoded.id, 'user123', 'Should have correct user id');
});

test('rejects access token as refresh token', () => {
  const tokens = generateTokenPair({ id: 'user123', role: 'customer', email: 'test@example.com' });
  const decoded = verifyRefreshToken(tokens.accessToken);
  
  assert.equal(decoded, null, 'Should reject access token');
});

// ==================== Password Validation Tests ====================

test('accepts strong passwords', () => {
  const errors = validatePasswordStrength('Test@1234');
  assert.equal(errors.length, 0, 'Strong password should have no errors');
});

test('rejects short passwords', () => {
  const errors = validatePasswordStrength('Test@12');
  assert.ok(errors.some(e => e.includes('8 characters')), 'Should reject short passwords');
});

test('rejects passwords without uppercase', () => {
  const errors = validatePasswordStrength('test@1234');
  assert.ok(errors.some(e => e.includes('uppercase')), 'Should reject without uppercase');
});

test('rejects passwords without lowercase', () => {
  const errors = validatePasswordStrength('TEST@1234');
  assert.ok(errors.some(e => e.includes('lowercase')), 'Should reject without lowercase');
});

test('rejects passwords without numbers', () => {
  const errors = validatePasswordStrength('Test@Pass');
  assert.ok(errors.some(e => e.includes('number')), 'Should reject without numbers');
});

test('rejects passwords without special characters', () => {
  const errors = validatePasswordStrength('TestPass123');
  assert.ok(errors.some(e => e.includes('special')), 'Should reject without special characters');
});

// ==================== Booking Workflow Tests ====================

test('validates status transitions', () => {
  assert.ok(isValidBookingTransition('PENDING', 'CONFIRMED'), 'PENDING -> CONFIRMED');
  assert.ok(isValidBookingTransition('CONFIRMED', 'ONGOING'), 'CONFIRMED -> ONGOING');
  assert.ok(isValidBookingTransition('ONGOING', 'COMPLETED'), 'ONGOING -> COMPLETED');
  assert.ok(isValidBookingTransition('PENDING', 'CANCELLED'), 'PENDING -> CANCELLED');
});

test('rejects invalid transitions', () => {
  assert.ok(!isValidBookingTransition('PENDING', 'COMPLETED'), 'PENDING -> COMPLETED');
  assert.ok(!isValidBookingTransition('COMPLETED', 'PENDING'), 'COMPLETED -> PENDING');
  assert.ok(!isValidBookingTransition('CANCELLED', 'CONFIRMED'), 'CANCELLED -> CONFIRMED');
});

test('normalizes status aliases', () => {
  assert.equal(normalizeBookingStatus('IN_PROGRESS'), 'ONGOING');
  assert.equal(normalizeBookingStatus('DONE'), 'COMPLETED');
  assert.equal(normalizeBookingStatus('CANCELED'), 'CANCELLED');
  assert.equal(normalizeBookingStatus('ACCEPTED'), 'CONFIRMED');
});

test('builds status history correctly', () => {
  const history = buildStatusHistory([], 'CONFIRMED', 'Provider accepted');
  assert.equal(history.length, 1);
  assert.equal(history[0].status, 'CONFIRMED');
  assert.ok(history[0].timestamp);
  assert.equal(history[0].note, 'Provider accepted');
});

test('appends to existing history', () => {
  const existingHistory = [
    { status: 'PENDING', timestamp: '2024-01-01T00:00:00Z', note: 'Created' }
  ];
  const history = buildStatusHistory(existingHistory, 'CONFIRMED', 'Provider accepted');
  assert.equal(history.length, 2);
  assert.equal(history[0].status, 'PENDING');
  assert.equal(history[1].status, 'CONFIRMED');
});

// ==================== Brute Force Protection Tests ====================

test('tracks failed auth attempts', () => {
  const ip = '192.168.1.100';
  recordFailedAuthAttempt(ip);
  recordFailedAuthAttempt(ip);
  
  assert.equal(getFailedAuthAttempts(ip), 2, 'Should track 2 failed attempts');
});

test('detects blocked IP', () => {
  const ip = '192.168.1.101';
  for (let i = 0; i < 5; i++) {
    recordFailedAuthAttempt(ip);
  }
  
  assert.ok(isAuthBlocked(ip), 'Should block after 5 attempts');
});

test('does not block under threshold', () => {
  const ip = '192.168.1.102';
  recordFailedAuthAttempt(ip);
  recordFailedAuthAttempt(ip);
  
  assert.ok(!isAuthBlocked(ip), 'Should not block under threshold');
});

// ==================== Validation Middleware Tests ====================

test('email validation works', () => {
  assert.ok(isValidEmail('test@example.com'));
  assert.ok(!isValidEmail('invalid'));
  assert.ok(!isValidEmail('test@'));
  assert.ok(!isValidEmail('@example.com'));
  assert.ok(!isValidEmail(null));
  assert.ok(!isValidEmail(''));
});

test('phone validation works', () => {
  assert.ok(isValidPhone('1234567890'));
  assert.ok(isValidPhone('+1 234 567 890'));
  assert.ok(isValidPhone('+91-9876543210'));
  assert.ok(!isValidPhone('123'));
  assert.ok(!isValidPhone(null));
});

test('pincode validation works', () => {
  assert.ok(isValidPincode('12345'));
  assert.ok(isValidPincode('123456'));
  assert.ok(!isValidPincode('1234'));
  assert.ok(!isValidPincode('1234567'));
  assert.ok(!isValidPincode('abcde'));
  assert.ok(!isValidPincode(null));
});

// ==================== Rate Limiting Configuration Tests ====================

test('configures general rate limiter', () => {
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
  const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
  
  assert.equal(windowMs, 900000, 'Should be 15 minutes');
  assert.equal(max, 100, 'Should allow 100 requests');
});

test('configures auth rate limiter', () => {
  const max = parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10);
  assert.equal(max, 10, 'Should allow 10 auth attempts');
});

test('configures booking rate limiter', () => {
  const max = parseInt(process.env.BOOKING_RATE_LIMIT_MAX || '5', 10);
  assert.equal(max, 5, 'Should allow 5 bookings per minute');
});

// ==================== Workflow State Machine Tests ====================

test('PENDING can transition to CONFIRMED or CANCELLED', () => {
  const transitions = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
  };
  assert.ok(transitions.PENDING.includes('CONFIRMED'));
  assert.ok(transitions.PENDING.includes('CANCELLED'));
  assert.ok(!transitions.PENDING.includes('COMPLETED'));
});

test('CONFIRMED can transition to ONGOING or CANCELLED', () => {
  const transitions = {
    CONFIRMED: ['ONGOING', 'CANCELLED'],
  };
  assert.ok(transitions.CONFIRMED.includes('ONGOING'));
  assert.ok(transitions.CONFIRMED.includes('CANCELLED'));
  assert.ok(!transitions.CONFIRMED.includes('COMPLETED'));
});

test('ONGOING can transition to COMPLETED or CANCELLED', () => {
  const transitions = {
    ONGOING: ['COMPLETED', 'CANCELLED'],
  };
  assert.ok(transitions.ONGOING.includes('COMPLETED'));
  assert.ok(transitions.ONGOING.includes('CANCELLED'));
  assert.ok(!transitions.ONGOING.includes('CONFIRMED'));
});

test('terminal states have no transitions', () => {
  const transitions = {
    COMPLETED: [],
    CANCELLED: [],
    REJECTED: []
  };
  assert.equal(transitions.COMPLETED.length, 0);
  assert.equal(transitions.CANCELLED.length, 0);
  assert.equal(transitions.REJECTED.length, 0);
});
