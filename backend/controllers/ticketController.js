import prisma from '../prisma/client.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';

export const TicketController = {
  getAll: async (req, res) => {
    try {
      if (!req.user) {
        return sendApiError(res, 401, 'UNAUTHORIZED', 'Authentication required');
      }

      const role = req.user.role;

      if (role !== 'admin') {
        const tickets = await prisma.ticket.findMany({
          where: { requesterEmail: req.user.email },
          orderBy: { createdAt: 'desc' }
        });
        return sendApiSuccess(res, 200, tickets);
      }

      const tickets = await prisma.ticket.findMany({ orderBy: { createdAt: 'desc' } });
      return sendApiSuccess(res, 200, tickets);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve support tickets', err.message);
    }
  },


  create: async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing support claim parameters (name, email, subject, message)');
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
      return sendApiSuccess(res, 201, ticket);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to file support ticket', err.message);
    }
  },

  resolve: async (req, res) => {
    try {
      if (!req.user) {
        return sendApiError(res, 401, 'UNAUTHORIZED', 'Authentication required');
      }

      const role = req.user.role;
      if (role !== 'admin') return sendApiError(res, 403, 'FORBIDDEN', 'Admin access required');

      const { id } = req.params;
      const { response } = req.body;

      if (!response) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'An admin resolution comment string is required.');
      }

      const ticket = await prisma.ticket.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          adminResponse: response,
          resolvedAt: new Date()
        }
      });
      return sendApiSuccess(res, 200, ticket);
    } catch (err) {
      if (err.code === 'P2025') {
        return sendApiError(res, 404, 'NOT_FOUND', 'Support ticket not found');
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to resolve support ticket', err.message);
    }
  }
};

