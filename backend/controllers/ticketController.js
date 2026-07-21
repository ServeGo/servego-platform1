import { TicketService } from '../services/ticket.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const TicketController = {
  getAll: async (req, res) => {
    try {
      const tickets = await TicketService.getAll(req.user);
      return sendApiSuccess(res, 200, tickets);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve support tickets');
    }
  },

  create: async (req, res) => {
    try {
      const io = req.app?.get('socketio');
      const ticket = await TicketService.create(req.body, req.user, io);
      return sendApiSuccess(res, 201, ticket);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to file support ticket');
    }
  },

  resolve: async (req, res) => {
    try {
      const { id } = req.params;
      const { response } = req.body;
      const ticket = await TicketService.resolve(id, response, req.user);
      return sendApiSuccess(res, 200, ticket);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to resolve support ticket');
    }
  },

  setStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, response } = req.body || {};
      const ticket = await TicketService.setStatus(id, status, response);
      return sendApiSuccess(res, 200, ticket);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to update support ticket');
    }
  }
};
