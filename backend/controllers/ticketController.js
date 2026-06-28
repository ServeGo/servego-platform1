import prisma from '../prisma/client.js';

export const TicketController = {
  getAll: async (req, res) => {
    try {
      // Public/non-admin endpoints should not be able to read tickets.
      // Keep backward compatibility: require explicit admin role.
      const role = req.body?.role ?? req.query?.role;
      if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

      const tickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
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

      const ticket = await prisma.ticket.create({
        data: {
          requesterName: name,
          requesterEmail: email,
          subject,
          message,
          status: 'OPEN'
        }
      });
      res.status(201).json(ticket);
    } catch (err) {
      res.status(500).json({ error: 'Failed to file support ticket', details: err.message });
    }
  },

  resolve: async (req, res) => {
    try {
      const role = req.body?.role ?? req.query?.role;
      if (role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

      const { id } = req.params;
      const { response } = req.body;

      if (!response) {
        return res.status(400).json({ error: 'An admin resolution comment string is required.' });
      }

      const ticket = await prisma.ticket.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          adminResponse: response,
          resolvedAt: new Date()
        }
      });
      res.json(ticket);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Support ticket not found' });
      }
      res.status(500).json({ error: 'Failed to resolve support ticket', details: err.message });
    }
  }
};

