import { PrismaClient } from '@prisma/client';

const isDev = process.env.NODE_ENV !== 'production';

const prisma = new PrismaClient({
  log: isDev ? ['warn', 'error'] : ['error'],
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
