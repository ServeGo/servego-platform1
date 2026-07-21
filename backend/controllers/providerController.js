import { ProviderRepository } from '../repositories/provider.repository.js';
import { ProviderService } from '../services/provider.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const ProviderController = {
  registerOwnProviderService: async (req, res) => {
    try {
      const provider = await ProviderRepository.findByUserId(req.user.id, { id: true, profileComplete: true });
      if (!provider) return sendApiError(res, 404, 'NOT_FOUND', 'Provider profile not found.');
      if (!provider.profileComplete) {
        return sendApiError(res, 403, 'PROFILE_INCOMPLETE', 'Complete your provider profile before submitting services.');
      }

      const io = req.app?.get('socketio');
      const created = await ProviderService.registerService(provider.id, req.body, req.user, io);
      return sendApiSuccess(res, 201, created);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to register provider service');
    }
  },

  getProviderServices: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ProviderService.getProviderServices(id, req.user);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch provider services');
    }
  },

  getMyProviderServices: async (req, res) => {
    try {
      const provider = await ProviderRepository.findByUserId(req.user.id, { id: true });
      if (!provider) return sendApiError(res, 404, 'NOT_FOUND', 'Provider profile not found.');
      const result = await ProviderService.getProviderServices(provider.id, req.user);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch provider services');
    }
  },

  registerProviderService: async (req, res) => {
    try {
      const { id } = req.params;
      const io = req.app?.get('socketio');
      const created = await ProviderService.registerService(id, req.body, req.user, io);
      return sendApiSuccess(res, 201, created);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to register provider service');
    }
  },

  getAll: async (req, res) => {
    try {
      const providers = await ProviderService.getAll(req.user);
      return sendApiSuccess(res, 200, providers);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch service partners');
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const provider = await ProviderService.getById(id, req.user);
      return sendApiSuccess(res, 200, provider);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve provider details');
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await ProviderService.updateProfile(id, req.body, req.user);
      return sendApiSuccess(res, 200, updated);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to update partner profile');
    }
  },

  updateAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await ProviderService.updateAvailability(id, req.body, req.user);
      return sendApiSuccess(res, 200, updated);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to update calendar availability schedule');
    }
  },

  verify: async (req, res) => {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;
      const updated = await ProviderService.verify(id, isVerified, req.user, req.ip);
      return sendApiSuccess(res, 200, updated);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to verify provider credentials');
    }
  }
};
