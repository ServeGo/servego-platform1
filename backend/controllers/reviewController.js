import { ReviewModel } from '../models/reviewModel.js';
import { BookingModel } from '../models/bookingModel.js';

export const ReviewController = {
  create: async (req, res) => {
    try {
      const { reviewerName, rating, comment, serviceCategory, providerId, bookingId } = req.body;

      if (!reviewerName || !rating || !providerId) {
        return res.status(400).json({ error: 'Missing core review parameters (reviewerName, rating, providerId)' });
      }

      // 1. Create review log in SQLite
      const review = await ReviewModel.create({
        reviewerName,
        rating: Number(rating),
        comment,
        serviceCategory,
        providerId
      });

      // 2. Mark corresponding booking as reviewed
      if (bookingId) {
        await BookingModel.setReviewed(bookingId);
      }

      res.status(201).json(review);
    } catch (err) {
      res.status(500).json({ error: 'Failed to record customer review log', details: err.message });
    }
  }
};
