import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';


import apiRouter from './routes/api.js';
import { seedServicesIfEmpty } from './seeders/servicesSeed.js';
import { getCorsConfig, resolvePort } from './utils/runtimeConfig.js';
import { helmetConfig, hppConfig, generalRateLimiter, requestSizeLimit } from './middleware/security.js';
import { requestLogger, errorHandler, requestTimeout } from './middleware/logging.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  const app = express();
  const httpServer = createServer(app);

  // Initialize Socket.io with enhanced configuration
  const io = new Server(httpServer, {
    cors: getCorsConfig(),
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    perMessageDeflate: {
      threshold: 1024
    }
  });

  app.set('socketio', io);

  // Trust proxy for correct IP detection behind reverse proxy
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmetConfig);
  app.use(hppConfig);

  // CORS configuration
  app.use(cors(getCorsConfig()));

  // Rate limiting (applied early)
  app.use(generalRateLimiter);

  // Request parsing with size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Request size validation
  app.use(requestSizeLimit);

  // Custom request logging
  app.use(requestLogger);

  // Request timeout (30 seconds default)
  app.use(requestTimeout(30000));

  // API versioning prefix for future compatibility
  app.use((req, res, next) => {
    // Remove trailing slashes for consistency
    if (req.path !== '/' && req.path.endsWith('/')) {
      const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
      return res.redirect(301, req.path.slice(0, -1) + query);
    }
    next();
  });

  // API routes
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    const health = {
      status: 'healthy',
      service: 'servego-backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      db: 'PostgreSQL',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };

    try {
      // Import lazily to avoid pulling Prisma during early boot if not needed.
      const prisma = (await import('./prisma/client.js')).default;
      await prisma.$queryRaw`SELECT 1 AS ok`;
      health.dbStatus = 'reachable';
      health.memoryUsage = {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      };
    } catch (dbErr) {
      health.dbStatus = 'unreachable';
      health.dbError = dbErr?.message || String(dbErr);
    }

    res.json(health);
  });

  // Socket.io connection handling with enhanced reconnection support
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}, IP: ${socket.handshake.address}`);

    // Join user-specific room for targeted notifications
    socket.on('join', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`🔌 User ${userId} joined their notification room`);
      }
    });

    // Handle explicit authentication
    socket.on('authenticate', (token) => {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'servego-dev-secret'
        );
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.join(`user:${decoded.id}`);
        socket.emit('authenticated', { success: true });
      } catch (err) {
        socket.emit('authenticated', { success: false, error: 'Invalid token' });
      }
    });




    // Leave notification room on logout
    socket.on('leave', (userId) => {
      if (userId) {
        socket.leave(`user:${userId}`);
        console.log(`🔌 User ${userId} left their notification room`);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id}, Reason: ${reason}`);
    });

    // Error handling for socket
    socket.on('error', (err) => {
      console.error(`🔌 Socket error: ${socket.id}`, err.message);
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  // Ensure the core service catalog always exists (no-op when already seeded).
  try {
    await seedServicesIfEmpty();
  } catch (seedErr) {
    console.error('Service catalog seed skipped:', seedErr.message);
  }

  const PORT = resolvePort(process.env.PORT, 4000);
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('===================================================');
    console.log(`🚀 ServeGo Engine fully online on http://0.0.0.0:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security: Helmet + Rate Limiting enabled`);
    console.log('===================================================');
  });
}

bootstrap();
