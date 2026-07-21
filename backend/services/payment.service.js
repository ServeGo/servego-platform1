import { PaymentRepository } from '../repositories/index.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { BadRequestError, NotFoundError, ForbiddenError, NotImplementedError } from '../errors/ApiError.js';
import { normalizePaymentStatus } from '../utils/workflow.js';
import { notifyPaymentReceived } from './notificationService.js';

export const PaymentService = {
  async webhook() {
    throw new NotImplementedError('PAYMENT_GATEWAY_UNAVAILABLE', 'No payment gateway webhook is configured.');
  },

  async getAll(user, query = {}) {
    const where = user.role === 'admin' ? {} : { userId: user.id };
    if (query.bookingId) where.bookingId = String(query.bookingId);

    return PaymentRepository.findMany({
      where,
      include: {
        booking: true,
        user: { select: { id: true, name: true, email: true, phone: true } }
      }
    });
  },

  async create(data, user) {
    const { bookingId, paymentMethod, status = 'PENDING', transactionId } = data;
    const userId = user.id;
    const role = user.role;

    if (!bookingId || !paymentMethod) {
      throw new BadRequestError('MISSING_FIELDS', 'Missing required fields: bookingId, paymentMethod.');
    }
    if (role !== 'customer' && role !== 'admin') {
      throw new ForbiddenError('FORBIDDEN', 'You are not allowed to process this payment.');
    }

    const normalizedMethod = String(paymentMethod).trim().toUpperCase();
    if (['UPI', 'CARD', 'CARDS'].includes(normalizedMethod)) {
      throw new NotImplementedError('PAYMENT_GATEWAY_UNAVAILABLE', 'UPI and card payments are not available until a payment gateway is configured. Choose Cash After Job.');
    }

    const booking = await BookingRepository.findById(bookingId);
    if (!booking) throw new NotFoundError('NOT_FOUND', 'Booking not found.');

    if (role === 'customer' && booking.customerId !== userId) {
      throw new ForbiddenError('FORBIDDEN', 'You can only pay for your own bookings.');
    }

    const normalizedStatus = normalizePaymentStatus(status);
    if (normalizedStatus === 'PAID') {
      throw new BadRequestError('INVALID_PAYMENT_STATUS', 'Payments can only be marked paid after verified completion.');
    }

    const payment = await PaymentRepository.create({
      bookingId,
      userId: booking.customerId,
      paymentMethod: normalizedMethod,
      status: normalizedStatus,
      transactionId,
      paidAt: normalizedStatus === 'PAID' ? new Date() : null
    });

    await BookingRepository.update(bookingId, {
      paymentStatus: normalizedStatus,
      paymentMethod: normalizedMethod
    });

    if (normalizedStatus === 'PAID') {
      await notifyPaymentReceived(userId, bookingId);
    }

    return payment;
  }
};
