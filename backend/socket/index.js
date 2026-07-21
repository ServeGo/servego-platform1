import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

export function setupSocketIO(io) {
  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`, { ip: socket.handshake.address });

    socket.on('join', (userId) => {
      if (!socket.userId || userId !== socket.userId) return;
      if (userId) {
        socket.join(`user:${userId}`);
        logger.debug(`User ${userId} joined notification room`);
      }
    });

    socket.on('authenticate', (token) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'servego-dev-secret');
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.join(`user:${decoded.id}`);
        if (decoded.role === 'admin') socket.join('room:admin');
        socket.emit('authenticated', { success: true, data: { userId: decoded.id, role: decoded.role } });
      } catch {
        socket.emit('authenticated', { success: false, error: 'Invalid token' });
      }
    });

    socket.on('leave', (userId) => {
      if (!socket.userId || userId !== socket.userId) return;
      if (userId) {
        socket.leave(`user:${userId}`);
        logger.debug(`User ${userId} left notification room`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected: ${socket.id}`, { reason });
    });

    socket.on('error', (err) => {
      logger.error(`Socket error: ${socket.id}`, { error: err.message });
    });
  });
}
