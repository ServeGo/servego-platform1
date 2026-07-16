/**
 * Prisma client with automatic mock fallback.
 *
 * Priority:
 *  1. If SERVEGO_MOCK_DATA=true → always use in-memory mock
 *  2. If DATABASE_URL is missing → use in-memory mock
 *  3. Otherwise try the real Prisma client; fall back to mock if the
 *     database schema is absent (tables not yet migrated) or unreachable.
 */
import process from 'node:process';

async function buildClient() {
  const forceMock = process.env.SERVEGO_MOCK_DATA === 'true';
  const hasUrl = Boolean(process.env.DATABASE_URL);

  if (forceMock || !hasUrl) {
    console.warn('[db] Running in mock-data mode — in-memory store active.');
    const { default: mock } = await import('./mockClient.js');
    return mock;
  }

  // Try real Prisma; fall back to mock on any connectivity / schema error
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({ log: ['warn', 'error'] });

    // Quick schema probe — detects "table does not exist" before any request
    await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`;

    console.info('[db] Connected to PostgreSQL via Prisma.');
    return prisma;
  } catch (err) {
    const isSchemaErr = err?.message?.includes('does not exist') || err?.code === 'P2021' || err?.code === 'P1001';
    if (isSchemaErr) {
      console.warn('[db] Database schema not migrated — falling back to in-memory mock store.');
    } else {
      console.warn('[db] Database unreachable — falling back to in-memory mock store.', err?.message);
    }
    const { default: mock } = await import('./mockClient.js');
    return mock;
  }
}

const client = await buildClient();
export default client;
