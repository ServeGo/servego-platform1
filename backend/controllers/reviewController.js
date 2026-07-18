import prisma from '../prisma/client.js';
import { refreshProviderReputation } from '../services/providerReputationService.js';
import { notifyReviewPublished } from '../services/notificationService.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';

export const ReviewController = {
  getAll: async (req, res) => {
    try {
      const reviews = await prisma.review.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          provider: { select: { id: true, user: { select: { name: true } } } },
          reviewer: { select: { name: true, email: true } }
        }
      });
      return sendApiSuccess(res, 200, reviews);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch reviews', err.message);
    }
  },

  create: async (req, res) => {
    try {
      const { reviewerId, reviewerName, rating, comment, serviceCategory, providerId, bookingId } = req.body;

      if (!reviewerId || !reviewerName || rating === undefined || !providerId) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing core review parameters (reviewerId, reviewerName, rating, providerId)', {
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
        return sendApiError(res, 400, 'INVALID_RATING', 'rating must be a valid number');
      }
      if (parsedRating < 1 || parsedRating > 5) {
        return sendApiError(res, 400, 'INVALID_RATING', 'rating must be between 1 and 5');
      }

      if (bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { id: true, providerId: true, customerId: true, status: true }
        });

        if (!booking) return sendApiError(res, 400, 'INVALID_BOOKING', 'Invalid bookingId');
        if (booking.providerId !== providerId) {
          return sendApiError(res, 400, 'INVALID_BOOKING', 'bookingId does not belong to the given providerId');
        }
        if (booking.customerId !== reviewerId) {
          return sendApiError(res, 403, 'FORBIDDEN', 'Only the customer who booked the service can leave a review.');
        }
        if (!['COMPLETED', 'REVIEWED'].includes(booking.status)) {
          return sendApiError(res, 409, 'BOOKING_NOT_COMPLETED', 'Reviews can only be submitted after the booking is completed.');
        }
      }

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

      await refreshProviderReputation(providerId);

      await notifyReviewPublished(reviewerId);

      return sendApiSuccess(res, 201, { review });
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to record customer review log', err.message);
    }
  }
};
