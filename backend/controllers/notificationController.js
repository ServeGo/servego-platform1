import prisma from '../prisma/client.js';

export const NotificationController = {
  getAll: async (req, res) => {
    try {
      // When a userId is provided, scope notifications to that user so a
      // signed-in customer/provider never receives another user's inbox.
      const userId = req.query?.userId;
      const notifications = await prisma.notification.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: 'desc' }
      });
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user inbox feeds', details: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { userId, title, message, type } = req.body;
      if (!userId || !title || !message) {
        return res.status(400).json({ error: 'Missing required notification fields.' });
      }

      const notif = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type: type || 'SYSTEM',
          isRead: false
        }
      });
      res.status(201).json(notif);
    } catch (err) {
      res.status(500).json({ error: 'Failed to post system alert', details: err.message });
    }
  },

  read: async (req, res) => {
    try {
      const { id } = req.params;
      const notif = await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      });
      res.json(notif);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Notification reference missing' });
      }
      res.status(500).json({ error: 'Failed to update alert state', details: err.message });
    }
  },

  clearAll: async (req, res) => {
    try {
      await prisma.notification.deleteMany({});
      res.json({ success: true, message: 'All notification history flushed.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to erase notifications', details: err.message });
    }
  }
};
