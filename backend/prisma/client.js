/**
 * Prisma client — production singleton.
 * Reads NEON_DATABASE_URL first (user-configured Neon DB),
 * falls back to DATABASE_URL (Replit-provisioned or env).
 */
import { PrismaClient } from '@prisma/client';
import process from 'node:process';

const dbUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error('[db] No DATABASE_URL or NEON_DATABASE_URL set. Cannot connect to the database.');
}

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
