import { CategoryService } from '../services/category.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const ServiceController = {
  getCategoryBySlug: async (req, res) => {
    try {
      const { slug } = req.params;
      const result = await CategoryService.getCategoryBySlug(slug, req.query);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch service category');
    }
  },

  getActiveCount: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await CategoryService.getActiveCount(id);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to count active specialists');
    }
  },

  getAll: async (req, res) => {
    try {
      const result = await CategoryService.getAll(req.query);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch services');
    }
  },

  search: async (req, res) => {
    try {
      const result = await CategoryService.search(req.query);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to search services');
    }
  },

  create: async (req, res) => {
    try {
      const created = await CategoryService.create(req.body);
      return sendApiSuccess(res, 201, created);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to create service');
    }
  },

  deleteOne: async (req, res) => {
    try {
      const { id } = req.params;
      const confirm = String(req.query.confirm || req.body?.confirm);
      const result = await CategoryService.deleteOne(id, confirm);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to delete service');
    }
  },

  updateOne: async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await CategoryService.updateOne(id, req.body);
      return sendApiSuccess(res, 200, { service: updated });
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to update service');
    }
  },

  hideOne: async (req, res) => {
    try {
      const { id } = req.params;
      const { isHidden } = req.body || {};
      const updated = await CategoryService.hideOne(id, isHidden);
      return sendApiSuccess(res, 200, { service: updated });
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to hide service');
    }
  }
};
