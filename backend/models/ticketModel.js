import { query, run, get } from '../config/db.js';

export const TicketModel = {
  getAll: async () => {
    return await query(`SELECT * FROM tickets ORDER BY date DESC`);
  },

  create: async ({ id, name, email, subject, message }) => {
    const ticketId = id || `TKT-${Math.floor(200 + Math.random() * 800)}`;
    const date = new Date().toISOString().split('T')[0];
    await run(`
      INSERT INTO tickets (id, name, email, subject, message, status, date)
      VALUES (?, ?, ?, ?, ?, 'open', ?)
    `, [ticketId, name, email, subject, message, date]);
    return await get(`SELECT * FROM tickets WHERE id = ?`, [ticketId]);
  },

  resolve: async (id, responseText) => {
    await run(`
      UPDATE tickets 
      SET status = 'resolved', response = ?
      WHERE id = ?
    `, [responseText, id]);
    return await get(`SELECT * FROM tickets WHERE id = ?`, [id]);
  }
};
