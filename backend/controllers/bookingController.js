import { BookingService } from '../services/booking.service.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { notifyBookingStatusChanged } from '../services/notificationService.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';
import { ApiError } from '../errors/ApiError.js';

export const BookingController = {
  getAll: async (req, res) => {
    try {
      const result = await BookingService.getAll(req.user, req.query);
      return sendApiSuccess(res, 200, result);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve bookings');
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await BookingService.getById(id, req.user);
      return sendApiSuccess(res, 200, booking);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch booking details');
    }
  },

  create: async (req, res) => {
    try {
      const result = await BookingService.create(req.body, req.user, { ip: req.ip });
      const io = req.app.get('socketio');
      if (io) {
        io.to(`user:${result.provider.user.id}`).emit('newJobLead', result.booking);
        io.to(`user:${result.provider.user.id}`).emit('notification', result.providerNotification);
        io.to(`user:${result.provider.user.id}`).emit('booking:created', { bookingId: result.booking.id });
        io.to(`user:${req.user.id}`).emit('booking:created', { bookingId: result.booking.id });
        io.to(`user:${result.provider.user.id}`).emit('notification:new', { notificationId: result.providerNotification.id, type: result.providerNotification.type });
      }
      return sendApiSuccess(res, 201, result.booking);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      if (err.code === 'SLOT_UNAVAILABLE' || err.code === 'P2034') {
        return sendApiError(res, 409, 'SLOT_UNAVAILABLE', 'This provider is already booked for the selected date and time slot.');
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to create booking.');
    }
  },

  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      const { updated, booking, provider } = await BookingService.updateStatus(id, status, note, req.user);

      const io = req.app.get('socketio');
      await notifyBookingStatusChanged(io, booking, status, provider?.userId);
      if (io) {
        const event = status === 'CANCELLED' ? 'booking:cancelled' : 'booking:statusChanged';
        const payload = { bookingId: updated.id, status };
        io.to(`user:${booking.customerId}`).emit(event, payload);
        if (provider?.userId) io.to(`user:${provider.userId}`).emit(event, payload);
      }

      return sendApiSuccess(res, 200, updated);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to update booking status');
    }
  },

  transition: (status) => async (req, res) => {
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
      const messages = await BookingService.getMessages(id, req.user);
      return sendApiSuccess(res, 200, messages);
    } catch (err) {
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch booking messages');
    }
  },

  getTimeline: async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await BookingRepository.findTimeline(id);
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
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch booking timeline');
    }
  },

  addMessage: async (req, res) => {
    try {
      const { id } = req.params;
      const { text } = req.body;

      const { updated, messageObj, booking } = await BookingService.addMessage(id, text, req.user);

      const io = req.app.get('socketio');
      if (io) {
        io.to(`booking:${id}`).emit('chatMessageReceived', { bookingId: id, message: messageObj });
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
      if (err instanceof ApiError) {
        return sendApiError(res, err.status, err.code, err.message, err.details);
      }
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to send message');
    }
  }
};
