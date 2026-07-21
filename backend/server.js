import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';

import apiRouter from './routes/index.js';
import { seedServicesIfEmpty } from './seeders/servicesSeed.js';
import { getCorsConfig, resolvePort } from './utils/runtimeConfig.js';
import { helmetConfig, hppConfig, generalRateLimiter, requestSizeLimit } from './middleware/security.js';
import { requestLogger, errorHandler, requestTimeout } from './middleware/logging.js';
import { sendApiSuccess } from './utils/response.js';
import { setupSocketIO } from './socket/index.js';
import { config } from './config/index.js';
import logger from './utils/logger.js';

dotenv.config();

async function bootstrap() {
  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: getCorsConfig(),
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    perMessageDeflate: { threshold: 1024 },
  });

  app.set('socketio', io);
  app.set('trust proxy', 1);

  app.use(helmetConfig);
  app.use(hppConfig);
  app.use(cors(getCorsConfig()));
  app.use(generalRateLimiter);

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(requestSizeLimit);

  app.use(requestLogger);
  app.use(requestTimeout(30000));

  app.use((req, res, next) => {
    if (req.path !== '/' && req.path.endsWith('/')) {
      const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
      return res.redirect(301, req.path.slice(0, -1) + query);
    }
    next();
  });

  app.get('/api/health', async (req, res) => {
    const health = {
      status: 'healthy',
      service: 'servego-backend',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      db: 'PostgreSQL',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    try {
      const { default: prisma } = await import('./prisma/client.js');
      await prisma.$queryRaw`SELECT 1 AS ok`;
      health.dbStatus = 'reachable';
      health.memoryUsage = {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      };
    } catch (dbErr) {
      health.dbStatus = 'unreachable';
      if (process.env.NODE_ENV !== 'production') health.dbError = dbErr?.message;
    }

    return sendApiSuccess(res, health.dbStatus === 'reachable' ? 200 : 503, health);
  });

  app.use('/api', apiRouter);

  setupSocketIO(io);

  app.use((req, res) => {
    res.status(404).json({ success: false, code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` });
  });

  app.use(errorHandler);

  const PORT = resolvePort(process.env.PORT, 4000);
  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`ServeGo Engine online on http://0.0.0.0:${PORT}`, { env: config.nodeEnv });
  });

  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use.`);
    } else {
      logger.error('Server error', { error: err.message });
    }
    process.exit(1);
  });

  void seedServicesIfEmpty().catch((seedErr) => {
    logger.warn('Service catalog seed skipped', { error: seedErr.message });
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down...`);
    httpServer.close(async () => {
      const { default: prisma } = await import('./prisma/client.js');
      await prisma.$disconnect();
      logger.info('Server closed.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
