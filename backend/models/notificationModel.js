import { query, run, get } from '../config/db.js';

export const NotificationModel = {
  getAll: async () => {
    const rows = await query(`SELECT * FROM notifications ORDER BY timestamp DESC`);
    return rows.map(r => ({ ...r, read: r.read === 1 }));
  },

  create: async ({ id, userId, role, title, message, type = 'general' }) => {
    const notifId = id || `n_${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();
    await run(`
      INSERT INTO notifications (id, userId, role, title, message, timestamp, read, type)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `, [notifId, userId, role, title, message, timestamp, type]);
    const r = await get(`SELECT * FROM notifications WHERE id = ?`, [notifId]);
    return { ...r, read: r.read === 1 };
  },

  markAsRead: async (id) => {
    await run(`UPDATE notifications SET read = 1 WHERE id = ?`, [id]);
    const r = await get(`SELECT * FROM notifications WHERE id = ?`, [id]);
    return r ? { ...r, read: r.read === 1 } : null;
  },

  clearAll: async () => {
    await run(`DELETE FROM notifications`);
    return true;
  }
};
