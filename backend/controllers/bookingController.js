import prisma from '../prisma/client.js';
import { refreshProviderReputation } from '../services/providerReputationService.js';
import { notifyBookingStatusChanged } from '../services/notificationService.js';
import { isProviderSlotTaken } from '../services/bookingAvailabilityService.js';
import { buildStatusHistory, isValidBookingTransition, normalizeBookingStatus, normalizePaymentStatus } from '../utils/workflow.js';
import { canPerformAction } from '../utils/permissions.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { isProviderAvailableForSlot, parseCalendarDate } from '../utils/availability.js';

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
      const { page = 1, limit = 50, status, providerId, customerId, adminSearch } = req.query;
      const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, Math.max(1, parseInt(limit)));

      const where = {};
      if (status) where.status = status;
      if (providerId) where.providerId = providerId;
      if (customerId) where.customerId = customerId;
      if (req.user.role === 'admin' && adminSearch) {
        where.id = { contains: String(adminSearch).trim(), mode: 'insensitive' };
      }

      if (req.user.role === 'provider') {
        const provider = await prisma.provider.findFirst({
          where: { userId: req.user.id },
          select: { id: true }
        });
        // A provider account without a profile must never fall through to an
        // unfiltered query and receive every booking in the system.
        if (!provider) {
          return sendApiSuccess(res, 200, {
            bookings: [],
            pagination: { page: parseInt(page), limit: Math.min(100, Math.max(1, parseInt(limit))), total: 0, pages: 0 }
          });
        }
        where.providerId = provider.id;
      } else if (req.user.role === 'customer') {
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

      return sendApiSuccess(res, 200, {
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
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve bookings',
        process.env.NODE_ENV !== 'production' ? err.message : undefined);
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
        return sendApiError(res, 404, 'NOT_FOUND', 'Booking not found.');
      }

      if (req.user.role === 'customer' && booking.customerId !== req.user.id) {
        return sendApiError(res, 403, 'FORBIDDEN', 'You can only view your own bookings.');
      }
      
      if (req.user.role === 'provider') {
        const provider = await prisma.provider.findFirst({
          where: { userId: req.user.id },
          select: { id: true }
        });
        if (!provider || booking.providerId !== provider.id) {
          return sendApiError(res, 403, 'FORBIDDEN', 'You can only view your assigned bookings.');
        }
      }

      return sendApiSuccess(res, 200, booking);
    } catch (err) {
      console.error('[BookingController.getById] Error:', err);
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch booking details',
        process.env.NODE_ENV !== 'production' ? err.message : undefined);
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

      const parsedBookingDate = parseCalendarDate(bookingData.bookingDate);
      if (!bookingData.bookingDate || Number.isNaN(parsedBookingDate.getTime())) {
        return sendApiError(res, 400, 'INVALID_DATE', 'A valid booking date is required.');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (parsedBookingDate < today) {
        return sendApiError(res, 400, 'INVALID_DATE', 'Booking date cannot be in the past.');
      }

      const [customer, provider] = await Promise.all([
        prisma.user.findUnique({ where: { id: customerId }, select: { id: true, name: true } }),
        prisma.provider.findUnique({ 
          where: { id: bookingData.providerId }, 
          include: {
            user: { select: { id: true, name: true, status: true } },
            availabilitySlots: true
          }
        })
      ]);

      if (!customer || !provider) {
        return sendApiError(res, 404, 'NOT_FOUND', 'Customer or provider not found.');
      }
      if (provider.accountStatus !== 'ACTIVE' || provider.user?.status !== 'ACTIVE') {
        return sendApiError(res, 409, 'PROVIDER_UNAVAILABLE', 'This provider is not currently accepting new bookings.');
      }
      if (!isProviderAvailableForSlot(provider, parsedBookingDate, bookingData.bookingTimeSlot)) {
        return sendApiError(res, 409, 'SLOT_UNAVAILABLE', 'This provider is not available for the selected date and time slot.');
      }
      const approvedService = await prisma.providerService.findFirst({
        where: {
          providerId: provider.id,
          ...(bookingData.serviceId
            ? { serviceId: bookingData.serviceId }
            : { service: { name: { equals: bookingData.serviceCategory, mode: 'insensitive' } } })
        },
        select: { serviceId: true }
      });
      if (!approvedService) {
        return sendApiError(res, 409, 'SERVICE_NOT_APPROVED', 'This provider is not approved for the requested service.');
      }

      const slotTaken = await isProviderSlotTaken(
        bookingData.providerId,
        parsedBookingDate,
        bookingData.bookingTimeSlot || 'Flexible'
      );
      if (slotTaken) {
        return sendApiError(res, 409, 'SLOT_UNAVAILABLE', 'This provider is already booked for the selected date and time slot.');
      }

      const activePendingBooking = await prisma.booking.findFirst({
        where: {
          customerId,
          providerId: bookingData.providerId,
          serviceCategory: bookingData.serviceCategory,
          status: 'PENDING',
          bookingDate: parsedBookingDate,
          bookingTimeSlot: bookingData.bookingTimeSlot || 'Flexible',
          ...(bookingData.serviceId ? { serviceId: bookingData.serviceId } : {})
        },
        select: { id: true, serviceCategory: true, status: true }
      });

      if (activePendingBooking) {
        return sendApiError(
          res,
          409,
          'SERVICE_ALREADY_PENDING',
          `You already have a pending booking (${activePendingBooking.id}) for this provider, service, date, and time slot.`
        );
      }

      const timestamp = new Date();
      
      const result = await prisma.$transaction(async (tx) => {
        // Recheck inside a serializable transaction so simultaneous requests
        // cannot both reserve the same provider/date/slot.
        if (await isProviderSlotTaken(bookingData.providerId, parsedBookingDate, bookingData.bookingTimeSlot, tx)) {
          const error = new Error('Selected slot is no longer available.');
          error.code = 'SLOT_UNAVAILABLE';
          throw error;
        }
        const booking = await tx.booking.create({
          data: {
            customerId,
            providerId: bookingData.providerId,
            serviceId: approvedService.serviceId,
            serviceCategory: bookingData.serviceCategory,
            bookingDate: parsedBookingDate,
            bookingTimeSlot: bookingData.bookingTimeSlot || 'Flexible',
            status: 'PENDING',
            paymentStatus: normalizePaymentStatus(bookingData.paymentStatus),
            paymentMethod: bookingData.paymentMethod || null,
            locationAddress: bookingData.locationAddress || '',
            city: bookingData.city || 'Hyderabad',
            instructions: bookingData.instructions || '',
            durationType: bookingData.serviceDurationType === 'permanent' ? 'PERMANENT' : 'CONTRACT',
            durationYears: parseInt(bookingData.durationYears || 0),
            durationDays: parseInt(bookingData.durationDays || 1),
            durationHours: parseInt(bookingData.durationHours || 0),
            amount: bookingData.amount === undefined || bookingData.amount === null || bookingData.amount === ''
              ? null
              : Number(bookingData.amount),
            bookingTime: timestamp,
            messages: [],
            reviewed: false,
            statusHistory: [
              { status: 'PENDING', timestamp: timestamp.toISOString(), note: 'Booking created by customer' }
            ]
          },
          include: BOOKING_INCLUDE
        });

        await tx.bookingEvent.create({
          data: {
            bookingId: booking.id,
            actorId: customerId,
            actorRole: 'customer',
            action: 'CREATED',
            note: 'Booking created'
          }
        });
        const providerNotification = await tx.notification.create({
          data: {
            userId: provider.user.id,
            title: 'New Service Request',
            message: `You have a new ${booking.serviceCategory} request from ${customer.name}.`,
            type: 'BOOKING',
            relatedBookingId: booking.id
          }
        });
        return { booking, providerNotification };
      }, { isolationLevel: 'Serializable' });

      const io = req.app.get('socketio');
      if (io) {
        io.to(`user:${provider.user.id}`).emit('newJobLead', result.booking);
        io.to(`user:${provider.user.id}`).emit('notification', result.providerNotification);
        io.to(`user:${provider.user.id}`).emit('booking:created', { bookingId: result.booking.id });
        io.to(`user:${actorId}`).emit('booking:created', { bookingId: result.booking.id });
        io.to(`user:${provider.user.id}`).emit('notification:new', { notificationId: result.providerNotification.id, type: result.providerNotification.type });
      }

      return sendApiSuccess(res, 201, result.booking);
    } catch (err) {
      if (err.code === 'SLOT_UNAVAILABLE' || err.code === 'P2034') {
        return sendApiError(res, 409, 'SLOT_UNAVAILABLE', 'This provider is already booked for the selected date and time slot.');
      }
      console.error('[BookingController.create] Error:', err.message, err.stack);
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to create booking.',
        process.env.NODE_ENV !== 'production' ? err.message : undefined);
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
      
      if (!['PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED'].includes(updatedStatus)) {
        return sendApiError(res, 400, 'INVALID_STATUS', 'Invalid booking status provided.');
      }


      const booking = await prisma.booking.findUnique({ where: { id } });
      if (!booking) return sendApiError(res, 404, 'NOT_FOUND', 'Booking not found.');

      const currentStatus = normalizeBookingStatus(booking.status);
      
      if (currentStatus === updatedStatus) {
        return sendApiError(res, 400, 'NO_CHANGE', 'Booking is already in this status.');
      }

      const provider = await prisma.provider.findUnique({ 
        where: { id: booking.providerId }, 
        select: { userId: true, accountStatus: true }
      });

      if (role === 'provider' && provider?.accountStatus === 'BLOCKED') {
        return sendApiError(res, 403, 'PROVIDER_BLOCKED', 'Blocked providers cannot update bookings.');
      }

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
      const paymentMethod = String(booking.paymentMethod || 'CASH').toUpperCase();
      const settlesCash = ['CASH', 'CASH AFTER JOB', 'CASH_AFTER_JOB'].includes(paymentMethod);

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: updatedStatus,
          statusHistory: newHistory,
          paymentStatus: updatedStatus === 'COMPLETED' && settlesCash ? 'PAID' : booking.paymentStatus,
          ...(updatedStatus === 'CANCELLED' ? {
            cancelledBy: requesterId,
            cancelledReason: note || null
          } : {})
        },
        include: BOOKING_INCLUDE
      });


      // Append BookingEvent audit row
      await prisma.bookingEvent.create({
        data: {
          bookingId: id,
          actorId: requesterId,
          actorRole: role,
          action: `STATUS_${updatedStatus}`,
          note: note || null
        }
      });
      if (updatedStatus === 'COMPLETED') {
        // Cash After Job is the only local payment path.  Completion settles
        // it once and creates the matching transaction row for dashboards.
        const method = booking.paymentMethod || 'CASH';
        if (settlesCash) {
          await prisma.payment.upsert({
            where: { bookingId: id },
            update: { status: 'PAID', paidAt: new Date(), paymentMethod: method },
            create: {
              bookingId: id,
              userId: booking.customerId,
              paymentMethod: method,
              status: 'PAID',
              paidAt: new Date()
            }
          });
        }
        await refreshProviderReputation(booking.providerId);
      }

      const io = req.app.get('socketio');
      await notifyBookingStatusChanged(io, booking, updatedStatus, provider?.userId);
      if (io) {
        const event = updatedStatus === 'CANCELLED' ? 'booking:cancelled' : 'booking:statusChanged';
        const payload = { bookingId: updated.id, status: updatedStatus };
        io.to(`user:${booking.customerId}`).emit(event, payload);
        if (provider?.userId) io.to(`user:${provider.userId}`).emit(event, payload);
      }

      return sendApiSuccess(res, 200, updated);
    } catch (err) {
      console.error('[BookingController.updateStatus] Error:', err);
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to update booking status',
        process.env.NODE_ENV !== 'production' ? err.message : undefined);
    }
  },

  transition: (status) => async (req, res) => {
    // Canonical action routes deliberately do not accept a client-selected status.
    if (status === 'CANCELLED' && !String(req.body?.reason || req.body?.note || '').trim()) {
      return sendApiError(res, 400, 'MISSING_FIELDS', 'A cancellation reason is required.');
    }
    if (status === 'CANCELLED') req.body = { ...(req.body || {}), note: req.body.reason || req.body.note };
    req.body = { ...(req.body || {}), status };
    return BookingController.updateStatus(req, res);
  },

  getMessages: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await prisma.booking.findUnique({ where: { id }, select: { customerId: true, providerId: true, messages: true } });
      if (!booking) return sendApiError(res, 404, 'NOT_FOUND', 'Booking not found.');
      if (req.user.role === 'customer' && booking.customerId !== req.user.id) return sendApiError(res, 403, 'FORBIDDEN', 'You can only view your own booking messages.');
      if (req.user.role === 'provider') {
        const provider = await prisma.provider.findUnique({ where: { userId: req.user.id }, select: { id: true } });
        if (!provider || provider.id !== booking.providerId) return sendApiError(res, 403, 'FORBIDDEN', 'You can only view messages for assigned bookings.');
      }
      return sendApiSuccess(res, 200, Array.isArray(booking.messages) ? booking.messages : []);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch booking messages', err.message);
    }
  },

  getTimeline: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await prisma.booking.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          statusHistory: true,
          serviceCategory: true,
          createdAt: true,
          customer: { select: { id: true, name: true, email: true } },
          provider: { include: { user: { select: { id: true, name: true } } } },
          events: { orderBy: { createdAt: 'asc' } }
        }
      });
      if (!booking) return sendApiError(res, 404, 'NOT_FOUND', 'Booking not found.');
      return sendApiSuccess(res, 200, {
        bookingId: booking.id,
        currentStatus: booking.status,
        serviceCategory: booking.serviceCategory,
        createdAt: booking.createdAt,
        customer: booking.customer,
        provider: booking.provider?.user,
        timeline: booking.events
      });
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch booking timeline', err.message);
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
      if (!booking) return sendApiError(res, 404, 'NOT_FOUND', 'Booking not found.');

      if (req.user.role === 'customer' && booking.customerId !== req.user.id) {
        return sendApiError(res, 403, 'FORBIDDEN', 'You can only send messages on your own bookings.');
      }
      if (req.user.role === 'provider') {
        const provider = await prisma.provider.findFirst({
          where: { userId: req.user.id },
          select: { id: true }
        });
        if (!provider || booking.providerId !== provider.id) {
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
        // Use the already-fetched updated booking (includes provider via BOOKING_INCLUDE)
        const otherPartyId = req.user.role === 'customer'
          ? updated?.provider?.user?.id
          : booking.customerId;
        if (otherPartyId) {
          io.to(`user:${otherPartyId}`).emit('bookingMessage', { bookingId: id, message: messageObj });
          io.to(`user:${otherPartyId}`).emit('booking:messageCreated', { bookingId: id, messageId: messageObj.id });
        }
      }

      return sendApiSuccess(res, 201, updated);
    } catch (err) {
      console.error('[BookingController.addMessage] Error:', err);
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to send message',
        process.env.NODE_ENV !== 'production' ? err.message : undefined);
    }
  }
};
