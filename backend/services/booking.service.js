import { BookingRepository } from '../repositories/booking.repository.js';
import { ProviderRepository } from '../repositories/provider.repository.js';
import { ProviderServiceLinkRepository, PaymentRepository, prisma } from '../repositories/index.js';
import { refreshProviderReputation } from './providerReputationService.js';
import { isProviderSlotTaken } from './bookingAvailabilityService.js';
import { buildStatusHistory, isValidBookingTransition, normalizeBookingStatus, normalizePaymentStatus } from '../utils/workflow.js';
import { canPerformAction } from '../utils/permissions.js';
import { isProviderAvailableForSlot, parseCalendarDate } from '../utils/availability.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../errors/ApiError.js';

export const BookingService = {
  async getAll(user, query) {
    const { page = 1, limit = 50, status, providerId, customerId, adminSearch } = query;
    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, Math.max(1, parseInt(limit)));
    const take = Math.min(100, Math.max(1, parseInt(limit)));

    const where = {};
    if (status) where.status = status;
    if (providerId) where.providerId = providerId;
    if (customerId) where.customerId = customerId;
    if (user.role === 'admin' && adminSearch) {
      where.id = { contains: String(adminSearch).trim(), mode: 'insensitive' };
    }

    if (user.role === 'provider') {
      const provider = await ProviderRepository.findByUserId(user.id, { id: true });
      if (!provider) return { bookings: [], pagination: { page: parseInt(page), limit: take, total: 0, pages: 0 } };
      where.providerId = provider.id;
    } else if (user.role === 'customer') {
      where.customerId = user.id;
    }

    const [bookings, total] = await Promise.all([
      BookingRepository.findMany({ where, include: BookingRepository.BOOKING_INCLUDE, skip, take, orderBy: { createdAt: 'desc' } }),
      BookingRepository.count(where),
    ]);

    return {
      bookings,
      pagination: { page: parseInt(page), limit: take, total, pages: Math.ceil(total / take) },
    };
  },

  async getById(id, user) {
    const booking = await BookingRepository.findById(id);
    if (!booking) throw new NotFoundError('NOT_FOUND', 'Booking not found.');

    if (user.role === 'customer' && booking.customerId !== user.id) {
      throw new ForbiddenError('FORBIDDEN', 'You can only view your own bookings.');
    }
    if (user.role === 'provider') {
      const provider = await ProviderRepository.findByUserId(user.id, { id: true });
      if (!provider || booking.providerId !== provider.id) {
        throw new ForbiddenError('FORBIDDEN', 'You can only view your assigned bookings.');
      }
    }
    return booking;
  },

  async create(data, user, reqMeta = {}) {
    const actorId = user.id;
    const actorRole = user.role;

    if (actorRole !== 'customer' && actorRole !== 'admin') {
      throw new ForbiddenError('FORBIDDEN', 'Only customers can create bookings.');
    }
    if (actorRole === 'customer' && data.customerId && data.customerId !== actorId) {
      throw new ForbiddenError('FORBIDDEN', 'You can only create bookings for yourself.');
    }
    if (!data.providerId || !data.serviceCategory) {
      throw new BadRequestError('MISSING_FIELDS', 'Missing required fields: providerId, serviceCategory.');
    }

    const customerId = actorRole === 'customer' ? actorId : data.customerId;
    if (!customerId) throw new BadRequestError('MISSING_FIELDS', 'Missing required field: customerId.');

    const parsedBookingDate = parseCalendarDate(data.bookingDate);
    if (!data.bookingDate || Number.isNaN(parsedBookingDate.getTime())) {
      throw new BadRequestError('INVALID_DATE', 'A valid booking date is required.');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedBookingDate < today) {
      throw new BadRequestError('INVALID_DATE', 'Booking date cannot be in the past.');
    }

    const [customer, provider] = await Promise.all([
      prisma.user.findUnique({ where: { id: customerId }, select: { id: true, name: true } }),
      ProviderRepository.findById(data.providerId, {
        include: { user: { select: { id: true, name: true, status: true } }, availabilitySlots: true },
      }),
    ]);

    if (!customer || !provider) throw new NotFoundError('NOT_FOUND', 'Customer or provider not found.');
    if (provider.accountStatus !== 'ACTIVE' || provider.user?.status !== 'ACTIVE') {
      throw new ConflictError('PROVIDER_UNAVAILABLE', 'This provider is not currently accepting new bookings.');
    }
    if (!isProviderAvailableForSlot(provider, parsedBookingDate, data.bookingTimeSlot)) {
      throw new ConflictError('SLOT_UNAVAILABLE', 'This provider is not available for the selected date and time slot.');
    }

    const approvedService = await ProviderServiceLinkRepository.findFirst(
      {
        providerId: provider.id,
        ...(data.serviceId ? { serviceId: data.serviceId } : { service: { name: { equals: data.serviceCategory, mode: 'insensitive' } } }),
      },
      { serviceId: true }
    );
    if (!approvedService) {
      throw new ConflictError('SERVICE_NOT_APPROVED', 'This provider is not approved for the requested service.');
    }

    const slotTaken = await isProviderSlotTaken(data.providerId, parsedBookingDate, data.bookingTimeSlot || 'Flexible');
    if (slotTaken) throw new ConflictError('SLOT_UNAVAILABLE', 'This provider is already booked for the selected date and time slot.');

    const activePendingBooking = await BookingRepository.findPendingDuplicate({
      customerId, providerId: data.providerId, serviceCategory: data.serviceCategory,
      status: 'PENDING', bookingDate: parsedBookingDate,
      bookingTimeSlot: data.bookingTimeSlot || 'Flexible',
      ...(data.serviceId ? { serviceId: data.serviceId } : {}),
    });
    if (activePendingBooking) {
      throw new ConflictError('SERVICE_ALREADY_PENDING', `You already have a pending booking (${activePendingBooking.id}) for this provider, service, date, and time slot.`);
    }

    const timestamp = new Date();
    const result = await prisma.$transaction(async (tx) => {
      if (await isProviderSlotTaken(data.providerId, parsedBookingDate, data.bookingTimeSlot, tx)) {
        const error = new Error('Selected slot is no longer available.');
        error.code = 'SLOT_UNAVAILABLE';
        throw error;
      }
      const booking = await tx.booking.create({
        data: {
          customerId, providerId: data.providerId, serviceId: approvedService.serviceId,
          serviceCategory: data.serviceCategory, bookingDate: parsedBookingDate,
          bookingTimeSlot: data.bookingTimeSlot || 'Flexible', status: 'PENDING',
          paymentStatus: normalizePaymentStatus(data.paymentStatus),
          paymentMethod: data.paymentMethod || null,
          locationAddress: data.locationAddress || '', city: data.city || 'Hyderabad',
          instructions: data.instructions || '',
          durationType: data.serviceDurationType === 'permanent' ? 'PERMANENT' : 'CONTRACT',
          durationYears: parseInt(data.durationYears || 0),
          durationDays: parseInt(data.durationDays || 1),
          durationHours: parseInt(data.durationHours || 0),
          amount: data.amount === undefined || data.amount === null || data.amount === '' ? null : Number(data.amount),
          bookingTime: timestamp, messages: [], reviewed: false,
          statusHistory: [{ status: 'PENDING', timestamp: timestamp.toISOString(), note: 'Booking created by customer' }],
        },
        include: BookingRepository.BOOKING_INCLUDE,
      });

      await tx.bookingEvent.create({
        data: { bookingId: booking.id, actorId: customerId, actorRole: 'customer', action: 'CREATED', note: 'Booking created' },
      });

      const providerNotification = await tx.notification.create({
        data: {
          userId: provider.user.id, title: 'New Service Request',
          message: `You have a new ${booking.serviceCategory} request from ${customer.name}.`,
          type: 'BOOKING', relatedBookingId: booking.id,
        },
      });
      return { booking, providerNotification };
    }, { isolationLevel: 'Serializable' });

    return result;
  },

  async updateStatus(id, status, note, user) {
    const role = user.role;
    const requesterId = user.id;

    if (!status) throw new BadRequestError('MISSING_FIELDS', 'A valid status string is required.');
    const updatedStatus = normalizeBookingStatus(status);
    if (!['PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED'].includes(updatedStatus)) {
      throw new BadRequestError('INVALID_STATUS', 'Invalid booking status provided.');
    }

    const booking = await BookingRepository.findById(id, { id: true, status: true, customerId: true, providerId: true, paymentMethod: true, statusHistory: true, paymentStatus: true });
    if (!booking) throw new NotFoundError('NOT_FOUND', 'Booking not found.');

    const currentStatus = normalizeBookingStatus(booking.status);
    if (currentStatus === updatedStatus) throw new BadRequestError('NO_CHANGE', 'Booking is already in this status.');

    const provider = await ProviderRepository.findById(booking.providerId, { select: { userId: true, accountStatus: true } });

    if (role === 'provider' && provider?.accountStatus === 'BLOCKED') {
      throw new ForbiddenError('PROVIDER_BLOCKED', 'Blocked providers cannot update bookings.');
    }

    const canUpdate = canPerformAction({
      role, action: 'update_booking_status',
      context: { requesterId, assignedProviderUserId: provider?.userId, customerId: booking.customerId, currentStatus, nextStatus: updatedStatus },
    }) && isValidBookingTransition(currentStatus, updatedStatus);

    if (!canUpdate) throw new ForbiddenError('FORBIDDEN', 'You are not allowed to perform this status transition.');

    const newHistory = buildStatusHistory(booking.statusHistory, updatedStatus, note);
    const paymentMethod = String(booking.paymentMethod || 'CASH').toUpperCase();
    const settlesCash = ['CASH', 'CASH AFTER JOB', 'CASH_AFTER_JOB'].includes(paymentMethod);

    const updated = await BookingRepository.update(id, {
      status: updatedStatus, statusHistory: newHistory,
      paymentStatus: updatedStatus === 'COMPLETED' && settlesCash ? 'PAID' : booking.paymentStatus,
      ...(updatedStatus === 'CANCELLED' ? { cancelledBy: requesterId, cancelledReason: note || null } : {}),
    });

    await BookingRepository.createEvent({
      bookingId: id, actorId: requesterId, actorRole: role, action: `STATUS_${updatedStatus}`, note: note || null,
    });

    if (updatedStatus === 'COMPLETED') {
      const method = booking.paymentMethod || 'CASH';
      if (settlesCash) {
        await PaymentRepository.upsert(id,
          { status: 'PAID', paidAt: new Date(), paymentMethod: method },
          { bookingId: id, userId: booking.customerId, paymentMethod: method, status: 'PAID', paidAt: new Date() }
        );
      }
      await refreshProviderReputation(booking.providerId);
    }

    return { updated, booking, provider };
  },

  async getMessages(id, user) {
    const booking = await BookingRepository.findMessages(id);
    if (!booking) throw new NotFoundError('NOT_FOUND', 'Booking not found.');
    if (user.role === 'customer' && booking.customerId !== user.id) throw new ForbiddenError('FORBIDDEN', 'You can only view your own booking messages.');
    if (user.role === 'provider') {
      const provider = await ProviderRepository.findByUserId(user.id, { id: true });
      if (!provider || provider.id !== booking.providerId) throw new ForbiddenError('FORBIDDEN', 'You can only view messages for assigned bookings.');
    }
    return Array.isArray(booking.messages) ? booking.messages : [];
  },

  async addMessage(id, text, user) {
    if (!text || !text.trim()) throw new BadRequestError('MISSING_FIELDS', 'Message text is required.');
    if (text.length > 2000) throw new BadRequestError('MESSAGE_TOO_LONG', 'Message text cannot exceed 2000 characters.');

    const booking = await BookingRepository.findById(id, { id: true, customerId: true, providerId: true, messages: true });
    if (!booking) throw new NotFoundError('NOT_FOUND', 'Booking not found.');

    if (user.role === 'customer' && booking.customerId !== user.id) throw new ForbiddenError('FORBIDDEN', 'You can only send messages on your own bookings.');
    if (user.role === 'provider') {
      const provider = await ProviderRepository.findByUserId(user.id, { id: true });
      if (!provider || booking.providerId !== provider.id) throw new ForbiddenError('FORBIDDEN', 'You can only send messages on your assigned bookings.');
    }

    const messageObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      senderId: user.id,
      senderName: user.email?.split('@')[0] || 'User',
      senderRole: user.role,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = await BookingRepository.update(id, { messages: [...(booking.messages || []), messageObj] });
    return { updated, messageObj, booking };
  },
};
