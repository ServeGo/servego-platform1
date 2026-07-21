import { ReviewService } from '../services/review.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const ReviewController = {
  getAll: async (req, res) => {
    try {
      const reviews = await ReviewService.getAll();
      return sendApiSuccess(res, 200, reviews);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch reviews');
    }
  },

  getByProvider: async (req, res) => {
    try {
      const { id } = req.params;
      const reviews = await ReviewService.getByProvider(id);
      return sendApiSuccess(res, 200, reviews);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch provider reviews');
    }
  },

  deleteOne: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const result = await ReviewService.deleteOne(id, reason);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to delete review');
    }
  },

  create: async (req, res) => {
    try {
      const result = await ReviewService.create(req.body, req.user);
      return sendApiSuccess(res, 201, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to record customer review log');
    }
  }
};
