import prisma from '../prisma/client.js';

export const PaymentRepository = {
  findMany: (args) => prisma.payment.findMany(args),
  findById: (bookingId) => prisma.payment.findUnique({ where: { bookingId } }),
  findFirst: (where, select) => prisma.payment.findFirst({ where, select }),
  upsert: (bookingId, update, create) => prisma.payment.upsert({ where: { bookingId }, update, create }),
  create: (data) => prisma.payment.create({ data }),
  update: (bookingId, data) => prisma.booking.update({ where: { id: bookingId }, data }),
  updateBooking: (bookingId, data) => prisma.booking.update({ where: { id: bookingId }, data }),
  aggregateSum: (where) => prisma.booking.aggregate({ _sum: { amount: true }, where }),
  count: (where) => prisma.payment.count({ where }),
  aggregate: (args) => prisma.payment.aggregate(args),
};

export const ReviewRepository = {
  findMany: (args) => prisma.review.findMany(args),
  findFirst: (where, select) => prisma.review.findFirst({ where, select }),
  findUnique: (where, select) => prisma.review.findUnique({ where, select }),
  create: (data) => prisma.review.create({ data }),
  delete: (where) => prisma.review.delete({ where }),
  count: (where) => prisma.review.count({ where }),
  findManyForRating: (where) => prisma.review.findMany({ where, select: { rating: true } }),
};

export const TicketRepository = {
  findMany: (args) => prisma.ticket.findMany(args),
  findFirst: (where, select) => prisma.ticket.findFirst({ where, select }),
  findUnique: (where, include) => prisma.ticket.findUnique({ where, include }),
  create: (data) => prisma.ticket.create({ data }),
  update: (where, data) => prisma.ticket.update({ where, data }),
  count: (where) => prisma.ticket.count({ where }),
};

export const NotificationRepository = {
  findMany: (args) => prisma.notification.findMany(args),
  findFirst: (where, select) => prisma.notification.findFirst({ where, select }),
  findUnique: (where, select) => prisma.notification.findUnique({ where, select }),
  create: (data) => prisma.notification.create({ data }),
  createMany: (data, skipDuplicates) => prisma.notification.createMany({ data, skipDuplicates }),
  update: (where, data) => prisma.notification.update({ where, data }),
  updateMany: (where, data) => prisma.notification.updateMany({ where, data }),
  deleteMany: (where) => prisma.notification.deleteMany({ where }),
};

export const ServiceRepository = {
  findMany: (args) => prisma.service.findMany(args),
  findFirst: (where, select) => prisma.service.findFirst({ where, select }),
  findUnique: (where, select) => prisma.service.findUnique({ where, select }),
  create: (data) => prisma.service.create({ data }),
  update: (where, data) => prisma.service.update({ where, data }),
  delete: (where) => prisma.service.delete({ where }),
  count: (where) => prisma.providerService.count({ where }),
  providerServiceCount: (where) => prisma.providerService.count({ where }),
  groupByServiceId: (where) => prisma.providerService.groupBy({ by: ['serviceId'], _count: { providerId: true }, where }),
};

export const SavedProRepository = {
  findMany: (args) => prisma.savedPro.findMany(args),
  upsert: (customerId, providerId) => prisma.savedPro.upsert({
    where: { customerId_providerId: { customerId, providerId } },
    update: {},
    create: { customerId, providerId },
  }),
  deleteMany: (where) => prisma.savedPro.deleteMany({ where }),
};

export const AuditRepository = {
  create: (data) => prisma.auditLog.create({ data }),
};

export const ProviderServiceDiscoveryRepository = {
  findApprovedByService: (serviceName, locationExtra = {}) => prisma.providerService.findMany({
    where: {
      service: { name: { equals: serviceName, mode: 'insensitive' } },
      provider: {
        accountStatus: 'ACTIVE',
        isVerified: true,
        user: { status: 'ACTIVE' },
        ...locationExtra,
      },
    },
    include: {
      provider: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
          reviews: true,
          badges: true,
        },
      },
      service: true,
    },
  }),

  findProvidersByCategory: (serviceId, locationExtra = {}, orderBy) => prisma.providerService.findMany({
    where: { serviceId, provider: { accountStatus: 'ACTIVE', isVerified: true, user: { status: 'ACTIVE' }, ...locationExtra } },
    include: { provider: { include: { user: { select: { id: true, name: true, avatar: true } }, badges: true } } },
    orderBy,
  }),
};

export const ProviderServiceRequestRepository = {
  findFirst: (where, select) => prisma.providerServiceRequest.findFirst({ where, select }),
  findUnique: (where, include) => prisma.providerServiceRequest.findUnique({ where, include }),
  findMany: (args) => prisma.providerServiceRequest.findMany(args),
  create: (data) => prisma.providerServiceRequest.create({ data }),
  update: (where, data) => prisma.providerServiceRequest.update({ where, data }),
  count: (where) => prisma.providerServiceRequest.count({ where }),
};

export const ProviderServiceLinkRepository = {
  findFirst: (where, select) => prisma.providerService.findFirst({ where, select }),
  findUnique: (where, include) => prisma.providerService.findUnique({ where, include }),
  findMany: (args) => prisma.providerService.findMany(args),
  create: (data) => prisma.providerService.create({ data }),
  upsert: (where, update, create) => prisma.providerService.upsert({ where, update, create }),
  update: (where, data) => prisma.providerService.update({ where, data }),
  count: (where) => prisma.providerService.count({ where }),
  groupBy: (args) => prisma.providerService.groupBy(args),
};

export const ProviderBadgeRepository = {
  findMany: (where, select) => prisma.providerBadge.findMany({ where, select }),
  createMany: (data) => prisma.providerBadge.createMany(data),
  deleteMany: (where) => prisma.providerBadge.deleteMany({ where }),
};

export const AvailabilitySlotRepository = {
  deleteMany: (where) => prisma.availabilitySlot.deleteMany({ where }),
  createMany: (data) => prisma.availabilitySlot.createMany(data),
};

export { prisma };
