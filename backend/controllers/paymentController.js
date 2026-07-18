import prisma from '../prisma/client.js';
import { normalizePaymentStatus } from '../utils/workflow.js';
import { notifyPaymentReceived } from '../services/notificationService.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';

export const PaymentController = {
  webhook: async (_req, res) => {
    // Accepting unsigned callbacks would let callers alter payment state.
    return sendApiError(res, 501, 'PAYMENT_GATEWAY_UNAVAILABLE', 'No payment gateway webhook is configured.');
  },

  getAll: async (req, res) => {
    try {
      const where = req.user.role === 'admin' ? {} : { userId: req.user.id };
      if (req.query.bookingId) where.bookingId = String(req.query.bookingId);
      const payments = await prisma.payment.findMany({ where, include: { booking: true, user: true } });
      return sendApiSuccess(res, 200, payments);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch payments', err.message);
    }
  },

  create: async (req, res) => {
    try {
      const { bookingId, paymentMethod, status = 'PENDING', transactionId } = req.body;
      const userId = req.user.id;
      const role = req.user.role;

      if (!bookingId || !paymentMethod) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing required fields: bookingId, paymentMethod.');
      }
      if (role !== 'customer' && role !== 'admin') {
        return sendApiError(res, 403, 'FORBIDDEN', 'You are not allowed to process this payment.');
      }

      const normalizedMethod = String(paymentMethod).trim().toUpperCase();
      if (['UPI', 'CARD', 'CARDS'].includes(normalizedMethod)) {
        return sendApiError(res, 501, 'PAYMENT_GATEWAY_UNAVAILABLE', 'UPI and card payments are not available until a payment gateway is configured. Choose Cash After Job.');
      }

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) return sendApiError(res, 404, 'NOT_FOUND', 'Booking not found.');

      if (role === 'customer' && booking.customerId !== userId) {
        return sendApiError(res, 403, 'FORBIDDEN', 'You can only pay for your own bookings.');
      }

      const normalizedStatus = normalizePaymentStatus(status);
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          userId,
          paymentMethod: normalizedMethod,
          status: normalizedStatus,
          transactionId,
          paidAt: normalizedStatus === 'PAID' ? new Date() : null
        }
      });

      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: normalizedStatus, paymentMethod: normalizedMethod }
      });

      if (normalizedStatus === 'PAID') {
        await notifyPaymentReceived(userId, bookingId);
      }

      return sendApiSuccess(res, 201, payment);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to create payment record', err.message);
    }
  }
};
