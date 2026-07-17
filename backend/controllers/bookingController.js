import prisma from '../prisma/client.js';
import { refreshProviderReputation } from '../services/providerReputationService.js';
import { notifyBookingCreated, notifyBookingStatusChanged } from '../services/notificationService.js';
import { isProviderSlotTaken } from '../services/bookingAvailabilityService.js';
import { buildStatusHistory, isValidBookingTransition, normalizeBookingStatus, normalizePaymentStatus } from '../utils/workflow.js';
import { canPerformAction } from '../utils/permissions.js';
import { sendApiError } from '../utils/response.js';

const BOOKING_INCLUDE = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  provider: {
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, avatar: true } }
    }
  },
  service: true,
  payment: true
};

export const BookingController = {
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 50, status, providerId, customerId } = req.query;
      const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, Math.max(1, parseInt(limit)));

      const where = {};
      if (status) where.status = status;
      if (providerId) where.providerId = providerId;
      if (customerId) where.customerId = customerId;

      // Filter based on user role
      if (req.user.role === 'provider') {
        // Provider should only see their bookings
        const provider = await prisma.provider.findFirst({
          where: { userId: req.user.id },
          select: { id: true }
        });
        if (provider) {
          where.providerId = provider.id;
        }
      } else if (req.user.role === 'customer') {
        // Customer should only see their bookings
        where.customerId = req.user.id;
      }

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: BOOKING_INCLUDE,
          skip,
          take: Math.min(100, Math.max(1, parseInt(limit))),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.booking.count({ where })
      ]);

      res.json({
        bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / Math.min(100, Math.max(1, parseInt(limit))))
        }
      });
    } catch (err) {
      console.error('[BookingController.getAll] Error:', err);
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve bookings', err.message);
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const booking = await prisma.booking.findUnique({ 
        where: { id }, 
        include: BOOKING_INCLUDE 
      });
      
      if (!booking) {
        return sendApiError(res, 404, 'BOOKING_NOT_FOUND', 'Booking not found.');
      }

      // Authorization check - ensure user can only view their own bookings or providers can view assigned bookings
      if (req.user.role === 'customer' && booking.customerId !== req.user.id) {
        return sendApiError(res, 403, 'FORBIDDEN', 'You can only view your own bookings.');
      }
      
      if (req.user.role === 'provider') {
        const provider = await prisma.provider.findFirst({
          where: { userId: req.user.id },
          select: { id: true }
        });
        if (provider && booking.providerId !== provider.id) {
          return sendApiError(res, 403, 'FORBIDDEN', 'You can only view your assigned bookings.');
        }
      }

      res.json(booking);
    } catch (err) {
      console.error('[BookingController.getById] Error:', err);
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch booking details', err.message);
    }
  },

  create: async (req, res) => {
    try {
      const bookingData = req.body;
      const actorId = req.user.id;
      const actorRole = req.user.role;

      if (actorRole !== 'customer' && actorRole !== 'admin') {
        return sendApiError(res, 403, 'FORBIDDEN', 'Only customers can create bookings.');
      }
      if (actorRole === 'customer' && bookingData.customerId && bookingData.customerId !== actorId) {
        return sendApiError(res, 403, 'FORBIDDEN', 'You can only create bookings for yourself.');
      }
      if (!bookingData.providerId || !bookingData.serviceCategory) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing required fields: providerId, serviceCategory.');
      }

      const customerId = actorRole === 'customer' ? actorId : bookingData.customerId;
      if (!customerId) return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing required field: customerId.');

      const parsedBookingDate = new Date(bookingData.bookingDate);
      if (!bookingData.bookingDate || Number.isNaN(parsedBookingDate.getTime())) {
        return sendApiError(res, 400, 'INVALID_DATE', 'A valid booking date is required.');
      }

      // Validate booking date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsedBookingDate < today) {
        return sendApiError(res, 400, 'INVALID_DATE', 'Booking date cannot be in the past.');
      }

      const [customer, provider] = await Promise.all([
        prisma.user.findUnique({ where: { id: customerId }, select: { id: true, name: true } }),
        prisma.provider.findUnique({ 
          where: { id: bookingData.providerId }, 
          include: { user: { select: { id: true, name: true } } } 
        })
      ]);

      if (!customer || !provider) {
        return sendApiError(res, 404, 'NOT_FOUND', 'Customer or provider not found.');
      }

      // Check provider availability
      const slotTaken = await isProviderSlotTaken(
        bookingData.providerId,
        parsedBookingDate,
        bookingData.bookingTimeSlot || 'Flexible'
      );
      if (slotTaken) {
        return sendApiError(res, 409, 'SLOT_UNAVAILABLE', 'This provider is already booked for the selected date and time slot.');
      }

      // One-active-booking-per-provider rule
      const activePendingBookingForSameService = await prisma.booking.findFirst({
        where: {
          customerId,
          providerId: bookingData.providerId,
          serviceId: bookingData.serviceId || undefined,
          serviceCategory: bookingData.serviceCategory,
          status: 'PENDING'
        },
        select: { id: true, serviceCategory: true, status: true }
      });

      const shouldFallbackToCategoryOnly = !bookingData.serviceId;
      const blockingBooking = activePendingBookingForSameService || (shouldFallbackToCategoryOnly
        ? await prisma.booking.findFirst({
            where: {
              customerId,
              providerId: bookingData.providerId,
              serviceCategory: bookingData.serviceCategory,
              status: 'PENDING'
            },
            select: { id: true, serviceCategory: true, status: true }
          })
        : null);

      if (blockingBooking) {
        return sendApiError(
          res,
          409,
          'SERVICE_ALREADY_PENDING',
          `You already have a pending booking (${blockingBooking.id}) with this provider for "${blockingBooking.serviceCategory}". Please wait until it is confirmed/ongoing/completed or cancelled before booking again.`
        );
      }

      const timestamp = new Date();
      
      // Use Prisma's create with auto-generated ID instead of manual counting
      const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            customerId,
            providerId: bookingData.providerId,
            serviceCategory: bookingData.serviceCategory,
            bookingDate: parsedBookingDate,
            bookingTimeSlot: bookingData.bookingTimeSlot || 'Flexible',
            status: 'PENDING',
            paymentStatus: normalizePaymentStatus(bookingData.paymentStatus),
            paymentMethod: bookingData.paymentMethod || null,
            locationAddress: bookingData.locationAddress || '',
            city: bookingData.city || 'Hyderabad',
            instructions: bookingData.instructions || '',
            bookingTime: timestamp,
            messages: [],
            reviewed: false,
            statusHistory: [
              { status: 'PENDING', timestamp: timestamp.toISOString(), note: 'Booking created by customer' }
            ]
          },
          include: BOOKING_INCLUDE
        });
        return booking;
      });

      const io = req.app.get('socketio');
      await notifyBookingCreated(io, result, customer, provider?.user?.id);

      res.status(201).json(result);
    } catch (err) {
      console.error('[BookingController.create] Error:', err.message, err.stack);
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to create booking.', err.message);
    }
  },

  updateStatus: async (req, res) => {
    try {
      const role = req.user.role;
      const requesterId = req.user.id;
      const { id } = req.params;
      const { status, note } = req.body;

      if (!status) return sendApiError(res, 400, 'MISSING_FIELDS', 'A valid status string is required.');

      const updatedStatus = normalizeBookingStatus(status);
      
      // Validate status transition
      if (!['PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(updatedStatus)) {
        return sendApiError(res, 400, 'INVALID_STATUS', 'Invalid booking status provided.');
      }

      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) return sendApiError(res, 404, 'BOOKING_NOT_FOUND', 'Booking not found.');

      const currentStatus = normalizeBookingStatus(booking.status);
      
      // Prevent redundant status update
      if (currentStatus === updatedStatus) {
        return sendApiError(res, 400, 'NO_CHANGE', 'Booking is already in this status.');
      }

      const provider = await prisma.provider.findUnique({ 
        where: { id: booking.providerId }, 
        select: { userId: true } 
      });

      const canUpdate = canPerformAction({
        role,
        action: 'update_booking_status',
        context: {
          requesterId,
          assignedProviderUserId: provider?.userId,
          customerId: booking.customerId,
          currentStatus,
          nextStatus: updatedStatus
        }
      }) && isValidBookingTransition(currentStatus, updatedStatus);

      if (!canUpdate) return sendApiError(res, 403, 'FORBIDDEN', 'You are not allowed to perform this status transition.');

      const newHistory = buildStatusHistory(booking.statusHistory, updatedStatus, note);

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: updatedStatus,
          statusHistory: newHistory,
          paymentStatus: updatedStatus === 'COMPLETED' ? 'PAID' : booking.paymentStatus
        },
        include: BOOKING_INCLUDE
      });

      // Refresh provider reputation after completion
      if (updatedStatus === 'COMPLETED') {
        await refreshProviderReputation(booking.providerId);
      }

      const io = req.app.get('socketio');
      await notifyBookingStatusChanged(io, booking, updatedStatus, provider?.userId);

      res.json(updated);
    } catch (err) {
      console.error('[BookingController.updateStatus] Error:', err);
      sendApiError(res, 500, 'INTERNAL_ERROR', err.message);
    }
  },

  addMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const { text } = req.body;
      const senderId = req.user.id;
      const senderName = req.user.email?.split('@')[0] || 'User';
      const senderRole = req.user.role;

      if (!text || !text.trim()) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Message text is required.');
      }

      if (text.length > 2000) {
        return sendApiError(res, 400, 'MESSAGE_TOO_LONG', 'Message text cannot exceed 2000 characters.');
      }

      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) return sendApiError(res, 404, 'BOOKING_NOT_FOUND', 'Booking not found.');

      // Authorization check
      if (req.user.role === 'customer' && booking.customerId !== req.user.id) {
        return sendApiError(res, 403, 'FORBIDDEN', 'You can only send messages on your own bookings.');
      }
      if (req.user.role === 'provider') {
        const provider = await prisma.provider.findFirst({
          where: { userId: req.user.id },
          select: { id: true }
        });
        if (provider && booking.providerId !== provider.id) {
          return sendApiError(res, 403, 'FORBIDDEN', 'You can only send messages on your assigned bookings.');
        }
      }

      const messageObj = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        senderId,
        senderName,
        senderRole,
        text: text.trim(),
        timestamp: new Date().toISOString()
      };

      const updated = await prisma.booking.update({
        where: { id },
        data: { messages: [...(booking.messages || []), messageObj] },
        include: BOOKING_INCLUDE
      });

      const io = req.app.get('socketio');
      if (io) {
        io.to(`booking:${id}`).emit('chatMessageReceived', { bookingId: id, message: messageObj });
        // Also emit to the other party's room
        const otherPartyId = req.user.role === 'customer' ? booking.provider?.user?.id : booking.customerId;
        if (otherPartyId) {
          io.to(`user:${otherPartyId}`).emit('bookingMessage', { bookingId: id, message: messageObj });
        }
      }

      res.status(201).json(updated);
    } catch (err) {
      console.error('[BookingController.addMessage] Error:', err);
      sendApiError(res, 500, 'INTERNAL_ERROR', err.message);
    }
  }
};
