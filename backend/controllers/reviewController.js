import prisma from '../prisma/client.js';

export const ReviewController = {
  create: async (req, res) => {
    try {
      const { reviewerId, reviewerName, rating, comment, serviceCategory, providerId, bookingId } = req.body;

      if (!reviewerId || !reviewerName || rating === undefined || !providerId) {
        return res.status(400).json({ error: 'Missing core review parameters (reviewerId, reviewerName, rating, providerId)' });
      }

      const review = await prisma.review.create({
        data: {
          reviewerId,
          reviewerName,
          rating: Number(rating),
          comment,
          serviceCategory,
          providerId,
          bookingId: bookingId || null
        }
      });

      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { reviewed: true }
        });
      }

      res.status(201).json(review);
    } catch (err) {
      res.status(500).json({ error: 'Failed to record customer review log', details: err.message });
    }
  }
};
