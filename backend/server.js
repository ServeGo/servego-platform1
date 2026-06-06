import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDB } from './config/db.js';
import apiRouter from './routes/api.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function bootstrap() {
  // 1. Initialize Relational DB Tables
  try {
    await initDB();
  } catch (dbErr) {
    console.error('❌ Critical database bootstrapper error:', dbErr);
  }

  const app = express();
  const httpServer = createServer(app);
  
  // 2. Configure Socket.IO Server
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // allow dynamic sandbox routing origins
      methods: ["GET", "POST", "PATCH", "DELETE"]
    }
  });

  // Make socket.io available inside Express handlers via req.app.get('socketio')
  app.set('socketio', io);

  // 4. Mount Globals & API Handlers
  app.use(cors());
  app.use(express.json());

  // Mount backend API router
  app.use('/api', apiRouter);

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: "healthy", 
      db: "SQLite relational",
      timestamp: new Date().toISOString() 
    });
  });

  // 5. Connect Real-Time Active WebSocket Connection States
  io.on('connection', (socket) => {
    console.log(`🔌 Live WebSocket Link Established: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Live WebSocket Link Cut: ${socket.id}`);
    });
  });

  // 6. Start Server on Port 4000 (standard routed external port)
  const PORT = 4000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`🚀 ServeGo Engine fully online on http://0.0.0.0:${PORT}`);
    console.log(`===================================================`);
  });
}

bootstrap();
