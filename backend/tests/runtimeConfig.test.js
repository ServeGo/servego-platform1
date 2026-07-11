import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePort, parseAllowedOrigins } from '../utils/runtimeConfig.js';

test('resolves a numeric port from the environment', () => {
  assert.equal(resolvePort('5000'), 5000);
});

test('falls back to the default port when the environment value is invalid', () => {
  assert.equal(resolvePort('not-a-port'), 4000);
  assert.equal(resolvePort(undefined), 4000);
});

test('parses allowed origins from a comma-separated environment value', () => {
  assert.deepEqual(parseAllowedOrigins('https://app.example.com, https://admin.example.com'), [
    'https://app.example.com',
    'https://admin.example.com'
  ]);
});
