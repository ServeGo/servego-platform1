import { ReferralService } from '../services/referral.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const ReferralsController = {
  applyReferral: async (req, res) => {
    try {
      const { code } = req.body || {};
      const result = await ReferralService.applyReferral(code, req.user.id);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to apply referral code');
    }
  },

  getMeReferral: async (req, res) => {
    try {
      const result = await ReferralService.getMeReferral(req.user.id);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch referral info');
    }
  },

  generate: async (req, res) => {
    try {
      const result = await ReferralService.generate(req.user.id);
      return sendApiSuccess(res, 201, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to generate referral code');
    }
  }
};
