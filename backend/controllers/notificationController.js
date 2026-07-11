import prisma from '../prisma/client.js';
import { sendApiError } from '../utils/response.js';

export const NotificationController = {
  getAll: async (req, res) => {
    try {
      const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      res.json(notifications);
    } catch (err) {
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch notifications', err.message);
    }
  },

  create: async (req, res) => {
    try {
      const { userId, title, message, type } = req.body;
      if (!userId || !title || !message) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing required fields: userId, title, message.');
      }
      const notif = await prisma.notification.create({
        data: { userId, title, message, type: type || 'SYSTEM', isRead: false }
      });
      res.status(201).json(notif);
    } catch (err) {
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to create notification', err.message);
    }
  },

  read: async (req, res) => {
    try {
      const { id } = req.params;
      const notif = await prisma.notification.update({ where: { id }, data: { isRead: true } });
      res.json(notif);
    } catch (err) {
      if (err.code === 'P2025') return sendApiError(res, 404, 'NOT_FOUND', 'Notification not found.');
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to mark notification as read', err.message);
    }
  },

  clearAll: async (req, res) => {
    try {
      // Admins can clear all; others only clear their own
      const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
      await prisma.notification.deleteMany({ where });
      res.json({ success: true, message: 'Notifications cleared.' });
    } catch (err) {
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to clear notifications', err.message);
    }
  }
};
