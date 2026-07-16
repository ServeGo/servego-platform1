import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import apiRouter from './routes/api.js';
import { seedServicesIfEmpty } from './seeders/servicesSeed.js';
import { getCorsConfig, resolvePort } from './utils/runtimeConfig.js';

dotenv.config();

async function bootstrap() {
  const app = express();
  const httpServer = createServer(app);

  const corsConfig = getCorsConfig();

  const io = new Server(httpServer, { cors: corsConfig });

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow static assets from CDN
    contentSecurityPolicy: false,                           // disabled — frontend manages CSP
  }));

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use(cors(corsConfig));

  // ── Compression ─────────────────────────────────────────────────────────────
  app.use(compression());

  // ── Body parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── Global rate limiter ─────────────────────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: 'RATE_LIMIT', message: 'Too many requests. Please try again later.' },
  });
  app.use('/api', globalLimiter);

  // Stricter limiter for auth endpoints to slow brute-force attacks
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: 'RATE_LIMIT', message: 'Too many login attempts. Please try again in 15 minutes.' },
  });
  app.use('/api/auth', authLimiter);

  // ── Custom headers ───────────────────────────────────────────────────────────
  app.use((req, res, next) => {
    res.setHeader('X-Powered-By', 'ServeGo');
    next();
  });

  // ── Shared Socket.io instance ────────────────────────────────────────────────
  app.set('socketio', io);

  // ── API routes ───────────────────────────────────────────────────────────────
  app.use('/api', apiRouter);

  // ── Health check ─────────────────────────────────────────────────────────────
  app.get('/api/health', async (req, res) => {
    const health = {
      status: 'healthy',
      service: 'servego-backend',
      timestamp: new Date().toISOString(),
    };

    try {
      const prisma = (await import('./prisma/client.js')).default;
      await prisma.$queryRaw`SELECT 1 AS ok`;
      health.db = 'reachable';
    } catch {
      health.db = 'mock';
    }

    res.json(health);
  });

  // ── Global error handler ─────────────────────────────────────────────────────
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({ error: 'Invalid JSON payload', details: err.message });
    }
    console.error('[server] Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  // ── Socket.io ────────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join a user-specific room for targeted notifications
    socket.on('join', (userId) => {
      if (userId) socket.join(`user:${userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  // ── Seed service catalog ──────────────────────────────────────────────────────
  try {
    await seedServicesIfEmpty();
  } catch (seedErr) {
    console.warn('[seed] Service catalog seed skipped:', seedErr.message);
  }

  // ── Start ────────────────────────────────────────────────────────────────────
  const PORT = resolvePort(process.env.PORT, 4000);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('===================================================');
    console.log(`🚀 ServeGo Engine online → http://0.0.0.0:${PORT}`);
    console.log('===================================================');
  });
}

bootstrap();
