import { TicketRepository } from '../repositories/index.js';
import { UserRepository } from '../repositories/user.repository.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '../errors/ApiError.js';

export const TicketService = {
  async getAll(user) {
    if (!user) {
      throw new UnauthorizedError('UNAUTHORIZED', 'Authentication required');
    }

    if (user.role !== 'admin') {
      return TicketRepository.findMany({
        where: { OR: [{ userId: user.id }, { userId: null, requesterEmail: user.email }] },
        orderBy: { createdAt: 'desc' }
      });
    }

    return TicketRepository.findMany({ orderBy: { createdAt: 'desc' } });
  },

  async create(data, user, io) {
    const { subject, message, relatedBookingId } = data;
    const account = user
      ? await UserRepository.findById(user.id, { name: true, email: true })
      : null;
    const name = account?.name || data?.name;
    const email = account?.email || data?.email;
    if (!name || !email || !subject || !message) {
      throw new BadRequestError('MISSING_FIELDS', 'Missing support claim parameters (name, email, subject, message)');
    }
    if (relatedBookingId && user) {
      const booking = await BookingRepository.findById(relatedBookingId);
      if (!booking || (user.role === 'customer' && booking.customerId !== user.id)) {
        throw new ForbiddenError('FORBIDDEN', 'You can only link your own booking to a support ticket.');
      }
    }

    const ticket = await TicketRepository.create({
      userId: user?.id || null,
      requesterName: name,
      requesterEmail: email,
      subject,
      message,
      relatedBookingId: relatedBookingId || null,
      status: 'OPEN'
    });

    if (io) io.to('room:admin').emit('adminAlert:newSupportTicket', { ticketId: ticket.id });

    return ticket;
  },

  async resolve(id, response, user) {
    if (!user) {
      throw new UnauthorizedError('UNAUTHORIZED', 'Authentication required');
    }
    if (user.role !== 'admin') {
      throw new ForbiddenError('FORBIDDEN', 'Admin access required');
    }
    if (!response) {
      throw new BadRequestError('MISSING_FIELDS', 'An admin resolution comment string is required.');
    }

    try {
      return await TicketRepository.update({ id }, {
        status: 'RESOLVED',
        adminResponse: response,
        resolvedAt: new Date()
      });
    } catch (err) {
      if (err.code === 'P2025') {
        throw new NotFoundError('NOT_FOUND', 'Support ticket not found');
      }
      throw err;
    }
  },

  async setStatus(id, status, response) {
    const normalized = String(status).toUpperCase();
    if (!['OPEN', 'RESOLVED', 'CLOSED'].includes(normalized)) {
      throw new BadRequestError('INVALID_STATUS', 'Status must be OPEN, RESOLVED, or CLOSED.');
    }
    if (response !== undefined && String(response).trim().length > 2000) {
      throw new BadRequestError('VALIDATION_ERROR', 'Response cannot exceed 2000 characters.');
    }

    const data = { status: normalized };
    if (response !== undefined) data.adminResponse = String(response).trim() || null;
    if (data.status === 'RESOLVED') data.resolvedAt = new Date();

    try {
      return await TicketRepository.update({ id }, data);
    } catch (err) {
      if (err.code === 'P2025') {
        throw new NotFoundError('NOT_FOUND', 'Support ticket not found.');
      }
      throw err;
    }
  }
};
