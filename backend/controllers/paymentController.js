import prisma from '../prisma/client.js';
import { normalizePaymentStatus } from '../utils/workflow.js';
import { canPerformAction } from '../utils/permissions.js';

export const PaymentController = {
  getAll: async (req, res) => {
    try {
      const payments = await prisma.payment.findMany({
        include: { booking: true, user: true }
      });
      res.json(payments);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch payments', details: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const { bookingId, userId, paymentMethod, status = 'PENDING', transactionId, role = 'customer' } = req.body;
      if (!bookingId || !userId || !paymentMethod) {
        return res.status(400).json({ error: 'Missing required payment fields.' });
      }

      if (!canPerformAction({ role, action: 'create_booking' })) {
        return res.status(403).json({ error: 'You are not allowed to process this payment.' });
      }

      const exists = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!exists) {
        return res.status(404).json({ error: 'Booking not found.' });
      }

      const normalizedStatus = normalizePaymentStatus(status);
      const payment = await prisma.payment.create({
        data: {
          bookingId,
          userId,
          paymentMethod,
          status: normalizedStatus,
          transactionId,
          paidAt: normalizedStatus === 'PAID' ? new Date() : null
        }
      });

      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: normalizedStatus,
          paymentMethod
        }
      });

      if (normalizedStatus === 'PAID') {
        await prisma.notification.create({
          data: {
            userId,
            title: 'Payment Received',
            message: `Payment for booking ${bookingId} was received successfully.`,
            type: 'PAYMENT',
            isRead: false
          }
        });
      }

      res.status(201).json(payment);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create payment record', details: err.message });
    }
  }
};
