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
      const bookings = await prisma.booking.findMany({ include: BOOKING_INCLUDE });
      res.json(bookings);
    } catch (err) {
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve bookings', err.message);
    }
  },

  getById: async (req, res) => {
    try {
      const booking = await prisma.booking.findUnique({ where: { id: req.params.id }, include: BOOKING_INCLUDE });
      if (!booking) return sendApiError(res, 404, 'BOOKING_NOT_FOUND', 'Booking not found.');
      res.json(booking);
    } catch (err) {
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

      const [customer, provider] = await Promise.all([
        prisma.user.findUnique({ where: { id: customerId }, select: { id: true, name: true } }),
        prisma.provider.findUnique({ where: { id: bookingData.providerId }, include: { user: { select: { id: true, name: true } } } })
      ]);

      if (!customer || !provider) {
        return sendApiError(res, 404, 'NOT_FOUND', 'Customer or provider not found.');
      }

      // Availability check — prevent double-booking the same slot
      const slotTaken = await isProviderSlotTaken(
        bookingData.providerId,
        parsedBookingDate,
        bookingData.bookingTimeSlot || 'Flexible'
      );
      if (slotTaken) {
        return sendApiError(res, 409, 'SLOT_UNAVAILABLE', 'This provider is already booked for the selected date and time slot.');
      }

      // One-active-booking-per-provider rule: a customer cannot book the same
      // provider again until their existing booking is completed/cancelled/denied.
      const activeBookingWithProvider = await prisma.booking.findFirst({
        where: {
          customerId,
          providerId: bookingData.providerId,
          status: { in: ['PENDING', 'CONFIRMED', 'ONGOING'] }
        },
        select: { id: true, serviceCategory: true, status: true }
      });
      if (activeBookingWithProvider) {
        return sendApiError(
          res, 409, 'PROVIDER_ALREADY_BOOKED',
          `You already have an active booking (${activeBookingWithProvider.id}) with this provider for "${activeBookingWithProvider.serviceCategory}". Please wait until it is completed or cancelled before booking again.`
        );
      }

      const timestamp = new Date();
      const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
      const initialStatus = 'PENDING';

      // Transaction: create booking atomically
      const result = await prisma.$transaction(async (tx) => {
        return tx.booking.create({
          data: {
            id: bookingId,
            customerId,
            providerId: bookingData.providerId,
            serviceCategory: bookingData.serviceCategory,
            bookingDate: parsedBookingDate,
            bookingTimeSlot: bookingData.bookingTimeSlot || 'Flexible',
            status: initialStatus,
            paymentStatus: normalizePaymentStatus(bookingData.paymentStatus),
            paymentMethod: bookingData.paymentMethod || null,
            locationAddress: bookingData.locationAddress || '',
            city: bookingData.city || 'Hyderabad',
            instructions: bookingData.instructions || '',
            bookingTime: timestamp,
            messages: [],
            reviewed: false,
            statusHistory: [
              { status: initialStatus, timestamp: timestamp.toISOString(), note: 'Booking created by customer' }
            ]
          },
          include: BOOKING_INCLUDE
        });
      });

      const io = req.app.get('socketio');
      await notifyBookingCreated(io, result, customer, provider?.user?.id);

      res.status(201).json(result);
    } catch (err) {
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
      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) return sendApiError(res, 404, 'BOOKING_NOT_FOUND', 'Booking not found.');

      const currentStatus = normalizeBookingStatus(booking.status);
      const provider = await prisma.provider.findUnique({ where: { id: booking.providerId }, select: { userId: true } });

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

      await refreshProviderReputation(booking.providerId);

      const io = req.app.get('socketio');
      await notifyBookingStatusChanged(io, booking, updatedStatus, provider?.userId);

      res.json(updated);
    } catch (err) {
      sendApiError(res, 400, 'BAD_REQUEST', err.message);
    }
  },

  addMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const { senderName, senderRole, text } = req.body;
      const senderId = req.user.id;

      if (!text) return sendApiError(res, 400, 'MISSING_FIELDS', 'Message text is required.');

      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) return sendApiError(res, 404, 'BOOKING_NOT_FOUND', 'Booking not found.');

      const messageObj = {
        id: `msg_${Math.random().toString(36).substring(2, 9)}`,
        senderId,
        senderName,
        senderRole,
        text,
        timestamp: new Date().toISOString()
      };

      const updated = await prisma.booking.update({
        where: { id },
        data: { messages: [...(booking.messages || []), messageObj] },
        include: BOOKING_INCLUDE
      });

      const io = req.app.get('socketio');
      if (io) io.emit('chatMessageReceived', { bookingId: id, message: messageObj });

      res.status(201).json(updated);
    } catch (err) {
      sendApiError(res, 400, 'BAD_REQUEST', err.message);
    }
  }
};
