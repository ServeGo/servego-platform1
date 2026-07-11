import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { generateAuthToken, verifyAuthToken, requireAuth, requireRole } from '../utils/auth.js';

const require = createRequire(import.meta.url);

test('signs and verifies a user token', () => {
  const token = generateAuthToken({ id: 'u1', role: 'customer' });
  const decoded = verifyAuthToken(token);

  assert.equal(decoded.id, 'u1');
  assert.equal(decoded.role, 'customer');
});

test('rejects tampered tokens', () => {
  const token = generateAuthToken({ id: 'u1', role: 'customer' });
  const tampered = `${token.slice(0, -1)}x`;

  assert.equal(verifyAuthToken(tampered), null);
});

test('requires authentication and role', async () => {
  const req = { headers: { authorization: `Bearer ${generateAuthToken({ id: 'u1', role: 'admin' })}` } };
  const res = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
  const next = () => {
    req.user = { id: 'u1', role: 'admin' };
  };

  await requireAuth(req, res, next);
  assert.equal(res.statusCode, 200);
  assert.equal(req.user.id, 'u1');

  const req2 = { headers: {} };
  const res2 = { status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; return this; } };
  let called = false;
  await requireAuth(req2, res2, () => { called = true; });
  assert.equal(res2.statusCode, 401);
  assert.equal(called, false);

  const req3 = { headers: { authorization: `Bearer ${generateAuthToken({ id: 'u2', role: 'customer' })}` } };
  const res3 = { status(code) { this.statusCode = code; return this; }, json(payload) { this.payload = payload; return this; } };
  let called3 = false;
  await requireRole('admin')(req3, res3, () => { called3 = true; });
  assert.equal(res3.statusCode, 403);
  assert.equal(called3, false);
});
