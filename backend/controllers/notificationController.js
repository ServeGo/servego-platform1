import { NotificationModel } from '../models/notificationModel.js';

export const NotificationController = {
  getAll: async (req, res) => {
    try {
      const notifications = await NotificationModel.getAll();
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user inbox feeds', details: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { userId, role, title, message, type } = req.body;
      const notif = await NotificationModel.create({ userId, role, title, message, type });
      res.status(201).json(notif);
    } catch (err) {
      res.status(500).json({ error: 'Failed to post system alert', details: err.message });
    }
  },

  read: async (req, res) => {
    try {
      const { id } = req.params;
      const notif = await NotificationModel.markAsRead(id);
      if (!notif) {
        return res.status(404).json({ error: 'Notification reference missing' });
      }
      res.json(notif);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update alert state', details: err.message });
    }
  },

  clearAll: async (req, res) => {
    try {
      await NotificationModel.clearAll();
      res.json({ success: true, message: 'All notification history flushed.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to erase notifications', details: err.message });
    }
  }
};
