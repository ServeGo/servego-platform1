import { PaymentService } from '../services/payment.service.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const PaymentController = {
  webhook: async (_req, res) => {
    try {
      await PaymentService.webhook();
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Payment webhook failed');
    }
  },

  getAll: async (req, res) => {
    try {
      const payments = await PaymentService.getAll(req.user, req.query);
      return sendApiSuccess(res, 200, payments);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch payments');
    }
  },

  create: async (req, res) => {
    try {
      const payment = await PaymentService.create(req.body, req.user);
      return sendApiSuccess(res, 201, payment);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to create payment record');
    }
  }
};
