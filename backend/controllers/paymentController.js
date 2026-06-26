import prisma from '../prisma/client.js';

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
      const { bookingId, userId, paymentMethod, status = 'PENDING', transactionId } = req.body;
      if (!bookingId || !userId || !paymentMethod) {
        return res.status(400).json({ error: 'Missing required payment fields.' });
      }


      const exists = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!exists) {
        return res.status(404).json({ error: 'Booking not found.' });
      }

      const payment = await prisma.payment.create({
        data: {
          bookingId,
          userId,
          paymentMethod,
          status,
          transactionId,
          paidAt: status === 'PAID' ? new Date() : null
        }
      });


      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: status,
          paymentMethod
        }
      });

      res.status(201).json(payment);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create payment record', details: err.message });
    }
  }
};
