import prisma from '../prisma/client.js';

export const ReviewController = {
  create: async (req, res) => {
    try {
      const { reviewerId, reviewerName, rating, comment, serviceCategory, providerId, bookingId } = req.body;

      if (!reviewerId || !reviewerName || rating === undefined || !providerId) {
        return res.status(400).json({
          error: 'Missing core review parameters (reviewerId, reviewerName, rating, providerId)',
          missing: {
            reviewerId: !reviewerId,
            reviewerName: !reviewerName,
            rating: rating === undefined,
            providerId: !providerId
          }
        });
      }

      const parsedRating = Number(rating);
      if (Number.isNaN(parsedRating)) {
        return res.status(400).json({ error: 'rating must be a valid number' });
      }
      if (parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ error: 'rating must be between 1 and 5' });
      }

      if (bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { id: true, providerId: true }
        });

        if (!booking) return res.status(400).json({ error: 'Invalid bookingId' });
        if (booking.providerId !== providerId) {
          return res.status(400).json({ error: 'bookingId does not belong to the given providerId' });
        }
      }

      // Basic shape validation: comment is optional but if provided must be a string.
      const safeComment = comment === undefined ? null : String(comment);

      const review = await prisma.review.create({
        data: {
          reviewerId,
          reviewerName,
          rating: parsedRating,
          comment: safeComment,
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
