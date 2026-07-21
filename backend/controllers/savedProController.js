import { SavedProService } from '../services/savedPro.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const SavedProController = {
  getMine: async (req, res) => {
    try {
      const saved = await SavedProService.getMine(req.user.id);
      return sendApiSuccess(res, 200, saved);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch saved pros');
    }
  },

  save: async (req, res) => {
    try {
      const { providerId } = req.body;
      const saved = await SavedProService.save(req.user.id, providerId);
      return sendApiSuccess(res, 201, saved);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to save provider');
    }
  },

  unsave: async (req, res) => {
    try {
      const { providerId } = req.params;
      const result = await SavedProService.unsave(req.user.id, providerId);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to unsave provider');
    }
  }
};
