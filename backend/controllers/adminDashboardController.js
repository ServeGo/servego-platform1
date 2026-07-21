import { AdminService } from '../services/admin.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const AdminDashboardController = {
  getSummary: async (req, res) => {
    try {
      const summary = await AdminService.getSummary();
      return sendApiSuccess(res, 200, summary);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to load dashboard metrics');
    }
  },

  getAnalytics: async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      const analytics = await AdminService.getAnalytics(period);
      return sendApiSuccess(res, 200, analytics);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to load analytics');
    }
  }
};
