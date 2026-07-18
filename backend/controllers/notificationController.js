import prisma from '../prisma/client.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';

export const NotificationController = {
  getAll: async (req, res) => {
    try {
      const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });
      return sendApiSuccess(res, 200, notifications);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch notifications', err.message);
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
      return sendApiSuccess(res, 201, notif);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to create notification', err.message);
    }
  },

  read: async (req, res) => {
    try {
      const { id } = req.params;
      const notif = await prisma.notification.update({ where: { id }, data: { isRead: true } });
      return sendApiSuccess(res, 200, notif);
    } catch (err) {
      if (err.code === 'P2025') return sendApiError(res, 404, 'NOT_FOUND', 'Notification not found.');
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to mark notification as read', err.message);
    }
  },

  clearAll: async (req, res) => {
    try {
      const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
      await prisma.notification.deleteMany({ where });
      return sendApiSuccess(res, 200, { message: 'Notifications cleared.' });
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to clear notifications', err.message);
    }
  }
};
