import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import apiRouter from './routes/api.js';
import { seedServicesIfEmpty } from './seeders/servicesSeed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
  });

  app.set('socketio', io);
  app.use(cors());
  app.use(express.json());

  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON payload', details: err.message });
    }
    next(err);
  });

  app.use('/api', apiRouter);

  app.get('/api/health', async (req, res) => {
    const health = {
      status: 'healthy',
      db: 'PostgreSQL',
      timestamp: new Date().toISOString()
    };

    try {
      // Import lazily to avoid pulling Prisma during early boot if not needed.
      const prisma = (await import('./prisma/client.js')).default;
      await prisma.$queryRaw`SELECT 1 AS ok`;
      health.dbStatus = 'reachable';
    } catch (dbErr) {
      health.dbStatus = 'unreachable';
      health.dbError = dbErr?.message || String(dbErr);
    }

    res.json(health);
  });


  io.on('connection', (socket) => {
    console.log(`🔌 Live WebSocket Link Established: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`🔌 Live WebSocket Link Cut: ${socket.id}`);
    });
  });

  // Ensure the core service catalog always exists (no-op when already seeded).
  try {
    await seedServicesIfEmpty();
  } catch (seedErr) {
    console.error('Service catalog seed skipped:', seedErr.message);
  }

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('===================================================');
    console.log(`🚀 ServeGo Engine fully online on http://0.0.0.0:${PORT}`);
    console.log('===================================================');
  });
}

bootstrap();
