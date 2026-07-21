import prisma from '../prisma/client.js';

const BOOKING_INCLUDE = {
  customer: { select: { id: true, name: true, email: true, phone: true } },
  provider: {
    include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } } },
  },
  service: true,
  payment: true,
};

export const BookingRepository = {
  BOOKING_INCLUDE,

  findById: (id, include = BOOKING_INCLUDE) => prisma.booking.findUnique({ where: { id }, include }),
  findMany: (args) => prisma.booking.findMany(args),
  count: (where) => prisma.booking.count({ where }),
  create: (data, include = BOOKING_INCLUDE) => prisma.booking.create({ data, include }),
  update: (id, data, include = BOOKING_INCLUDE) => prisma.booking.update({ where: { id }, data, include }),

  findSlotConflict: (providerId, bookingDate, bookingTimeSlot, tx = prisma) =>
    tx.booking.findFirst({
      where: {
        providerId,
        bookingTimeSlot,
        bookingDate: { gte: bookingDate, lte: new Date(new Date(bookingDate).setHours(23, 59, 59, 999)) },
        status: { in: ['PENDING', 'CONFIRMED', 'ONGOING'] },
      },
      select: { id: true },
    }),

  findPendingDuplicate: (where) => prisma.booking.findFirst({
    where,
    select: { id: true, serviceCategory: true, status: true },
  }),

  createEvent: (data) => prisma.bookingEvent.create({ data }),

  findTimeline: (id) => prisma.booking.findUnique({
    where: { id },
    select: {
      id: true, status: true, statusHistory: true, serviceCategory: true, createdAt: true,
      customer: { select: { id: true, name: true, email: true } },
      provider: { include: { user: { select: { id: true, name: true } } } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  }),

  aggregateAmount: (where) => prisma.booking.aggregate({ _sum: { amount: true }, where }),
  groupByStatus: (where) => prisma.booking.groupBy({ by: ['status'], _count: true, where }),
  groupByProvider: (where, orderBy) => prisma.booking.groupBy({ by: ['providerId'], _count: true, where, orderBy, take: 10 }),
  groupByCategory: (where, orderBy) => prisma.booking.groupBy({ by: ['serviceCategory'], _count: true, where, orderBy, take: 10 }),

  groupBy: (args) => prisma.booking.groupBy(args),

  findPaymentsForBookings: (where) => prisma.payment.findMany({ where, select: { status: true, paidAt: true, createdAt: true, bookingId: true } }),

  findMessages: (id) => prisma.booking.findUnique({ where: { id }, select: { customerId: true, providerId: true, messages: true } }),

  providerFindFirst: (where) => prisma.provider.findFirst({ where, select: { id: true } }),
};
