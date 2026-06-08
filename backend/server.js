import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import apiRouter from './routes/api.js';

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

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      db: 'PostgreSQL',
      timestamp: new Date().toISOString()
    });
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Live WebSocket Link Established: ${socket.id}`);
    socket.on('disconnect', () => {
      console.log(`🔌 Live WebSocket Link Cut: ${socket.id}`);
    });
  });

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('===================================================');
    console.log(`🚀 ServeGo Engine fully online on http://0.0.0.0:${PORT}`);
    console.log('===================================================');
  });
}

bootstrap();
