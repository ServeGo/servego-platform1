import { DiscoveryService } from '../services/discovery.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const ProviderServiceDiscoveryController = {
  getApprovedProvidersByCategory: async (req, res) => {
    try {
      const slug = req.params.slug;
      const result = await DiscoveryService.getByCategory(slug, req.query);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to discover approved providers');
    }
  },

  getApprovedProvidersByServiceName: async (req, res) => {
    try {
      const result = await DiscoveryService.getByServiceName(req.query);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to discover approved providers');
    }
  }
};
