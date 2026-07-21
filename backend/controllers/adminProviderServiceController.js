import { AdminService } from '../services/admin.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const AdminProviderServiceController = {
  getPendingRequests: async (req, res) => {
    try {
      const { status = 'PENDING' } = req.query;
      const requests = await AdminService.getPendingRequests(status);
      return sendApiSuccess(res, 200, requests);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch provider service requests');
    }
  },

  approveService: async (req, res) => {
    try {
      const { id } = req.params;
      const io = req.app?.get('socketio');
      const result = await AdminService.approveService(id, req.user.id, req.user.role, req.ip, io);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to approve service request');
    }
  },

  denyService: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const io = req.app?.get('socketio');
      const result = await AdminService.denyService(id, reason, req.user.id, req.user.role, req.ip, io);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to deny service request');
    }
  },

  refreshReputation: async (req, res) => {
    try {
      const result = await AdminService.refreshReputation();
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to refresh provider reputation');
    }
  }
};
