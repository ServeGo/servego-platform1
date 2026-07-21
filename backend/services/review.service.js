import { ReviewRepository } from '../repositories/index.js';
import { UserRepository } from '../repositories/user.repository.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../errors/ApiError.js';
import { refreshProviderReputation } from './providerReputationService.js';
import { notifyReviewPublished } from './notificationService.js';

export const ReviewService = {
  async getAll() {
    return ReviewRepository.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        provider: { select: { id: true, user: { select: { name: true } } } },
        reviewer: { select: { name: true, email: true } }
      }
    });
  },

  async getByProvider(id) {
    return ReviewRepository.findMany({
      where: { providerId: id },
      orderBy: { createdAt: 'desc' },
      include: { reviewer: { select: { name: true, avatar: true } } }
    });
  },

  async deleteOne(id, reason) {
    if (!reason || !String(reason).trim()) {
      throw new BadRequestError('MISSING_FIELDS', 'A moderation reason is required.');
    }
    const review = await ReviewRepository.findUnique({ id }, { id: true });
    if (!review) throw new NotFoundError('NOT_FOUND', 'Review not found.');
    await ReviewRepository.delete({ id });
    return { message: 'Review removed.' };
  },

  async create(data, user) {
    const { rating, comment, serviceCategory, providerId, bookingId } = data;
    const reviewerId = user.id;

    if (user.role !== 'customer') {
      throw new ForbiddenError('FORBIDDEN', 'Only customers can leave provider reviews.');
    }
    if (rating === undefined || !providerId) {
      throw new BadRequestError('MISSING_FIELDS', 'Missing core review parameters (rating, providerId)', {
        missing: {
          rating: rating === undefined,
          providerId: !providerId
        }
      });
    }

    const reviewer = await UserRepository.findById(reviewerId, { name: true });
    if (!reviewer) throw new NotFoundError('NOT_FOUND', 'Customer account not found.');

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating)) {
      throw new BadRequestError('INVALID_RATING', 'rating must be a valid number');
    }
    if (parsedRating < 1 || parsedRating > 5) {
      throw new BadRequestError('INVALID_RATING', 'rating must be between 1 and 5');
    }

    if (bookingId) {
      const booking = await BookingRepository.findById(bookingId);

      if (!booking) throw new BadRequestError('INVALID_BOOKING', 'Invalid bookingId');
      if (booking.providerId !== providerId) {
        throw new BadRequestError('INVALID_BOOKING', 'bookingId does not belong to the given providerId');
      }
      if (booking.customerId !== reviewerId) {
        throw new ForbiddenError('FORBIDDEN', 'Only the customer who booked the service can leave a review.');
      }
      if (!['COMPLETED', 'REVIEWED'].includes(booking.status)) {
        throw new ConflictError('BOOKING_NOT_COMPLETED', 'Reviews can only be submitted after the booking is completed.');
      }
      const existingReview = await ReviewRepository.findFirst({ bookingId }, { id: true });
      if (existingReview) throw new ConflictError('DUPLICATE_ENTRY', 'Only one review may be submitted per booking.');
    }

    const safeComment = comment === undefined ? null : String(comment);

    const review = await ReviewRepository.create({
      reviewerId,
      reviewerName: reviewer.name,
      rating: parsedRating,
      comment: safeComment,
      serviceCategory,
      providerId,
      bookingId: bookingId || null
    });

    if (bookingId) {
      await BookingRepository.update(bookingId, { reviewed: true });
    }

    await refreshProviderReputation(providerId);
    await notifyReviewPublished(reviewerId);

    return { review };
  }
};
