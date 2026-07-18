import test from 'node:test';
import assert from 'node:assert/strict';
import { sendApiError } from '../utils/response.js';

function responseDouble() {
  return {
    statusCode: null,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

test('does not leak raw internal error details', () => {
  const res = responseDouble();
  sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to save', 'PrismaClientKnownRequestError: database detail');
  assert.equal(res.statusCode, 500);
  assert.equal(res.payload.details, null);
});

test('retains validation field details for client correction', () => {
  const res = responseDouble();
  const fields = [{ field: 'email', message: 'Invalid email format' }];
  sendApiError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', fields);
  assert.deepEqual(res.payload.details, fields);
});
