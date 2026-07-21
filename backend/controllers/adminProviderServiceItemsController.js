import { AdminService } from '../services/admin.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const AdminProviderServiceItemsController = {
  getAll: async (req, res) => {
    try {
      const items = await AdminService.getServiceItems();
      return sendApiSuccess(res, 200, items);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch provider service items');
    }
  }
};
