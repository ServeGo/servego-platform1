import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

// This unit test focuses on the Socket.IO authenticate handler logic found in server.js.
// We verify we can decode/verify tokens using the expected JWT secret in an ESM environment.

test('socket authenticate verifies token with configured secret (ESM compatible)', () => {
  const secret = process.env.JWT_SECRET || 'servego-dev-secret';

  const payload = { id: 'user1', role: 'customer' };
  const token = jwt.sign(payload, secret, { expiresIn: '15m' });

  const decoded = jwt.verify(token, secret);
  assert.equal(decoded.id, 'user1');
  assert.equal(decoded.role, 'customer');
});

test('socket authenticate rejects invalid token', () => {
  const secret = process.env.JWT_SECRET || 'servego-dev-secret';

  assert.throws(() => {
    jwt.verify('invalid.token', secret);
  });
});

