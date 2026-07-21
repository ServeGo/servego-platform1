import { AdminService } from '../services/admin.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const AdminProviderStatusController = {
  setStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body || {};
      const io = req.app.get('socketio');
      const result = await AdminService.setStatus(id, status, reason, req.user.id, req.user.role, req.ip, io);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to update provider account status');
    }
  }
};
