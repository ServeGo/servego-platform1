import { TicketModel } from '../models/ticketModel.js';

export const TicketController = {
  getAll: async (req, res) => {
    try {
      const tickets = await TicketModel.getAll();
      res.json(tickets);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve support tickets', details: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Missing support claim parameters' });
      }

      const ticket = await TicketModel.create({ name, email, subject, message });
      res.status(201).json(ticket);
    } catch (err) {
      res.status(500).json({ error: 'Failed to file support ticket', details: err.message });
    }
  },

  resolve: async (req, res) => {
    try {
      const { id } = req.params;
      const { response } = req.body;

      if (!response) {
        return res.status(400).json({ error: 'An admin resolution comment string is required.' });
      }

      const ticket = await TicketModel.resolve(id, response);
      res.json(ticket);
    } catch (err) {
      res.status(550).json({ error: 'Failed to resolve support ticket', details: err.message });
    }
  }
};
