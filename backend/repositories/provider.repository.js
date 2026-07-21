import prisma from '../prisma/client.js';

export const ProviderRepository = {
  findById: (id, args = {}) => prisma.provider.findUnique({ where: { id }, ...args }),
  findByUserId: (userId, select) => prisma.provider.findFirst({ where: { userId }, select }),
  create: (data) => prisma.provider.create({ data }),
  findMany: (args) => prisma.provider.findMany(args),
  update: (id, data, include) => prisma.provider.update({ where: { id }, data, include }),

  getServices: (providerId) => prisma.providerService.findMany({
    where: { providerId },
    include: { service: true },
    orderBy: { createdAt: 'desc' },
  }),

  getServiceRequests: (providerId, whereExtra = {}) => prisma.providerServiceRequest.findMany({
    where: { providerId, ...whereExtra },
    orderBy: { createdAt: 'desc' },
  }),

  createServiceRequest: (data) => prisma.providerServiceRequest.create({ data }),
  findServiceRequest: (id, include) => prisma.providerServiceRequest.findUnique({ where: { id }, include }),
  updateServiceRequest: (id, data) => prisma.providerServiceRequest.update({ where: { id }, data }),
  findManyServiceRequests: (args) => prisma.providerServiceRequest.findMany(args),

  upsertServiceLink: (providerId, serviceId, data) => prisma.providerService.upsert({
    where: { providerId_serviceId: { providerId, serviceId } },
    update: data.update,
    create: { providerId, serviceId, ...data.create },
  }),

  findServiceLink: (where) => prisma.providerService.findFirst({ where, select: { id: true } }),

  replaceAvailabilitySlots: (providerId, slots) => prisma.$transaction(async (tx) => {
    await tx.availabilitySlot.deleteMany({ where: { providerId } });
    if (slots.length) {
      await tx.availabilitySlot.createMany({ data: slots.map((s) => ({ ...s, providerId })) });
    }
    return tx.provider.update({
      where: { id: providerId },
      data: {},
      include: { availabilitySlots: true },
    });
  }),

  updateWithTransaction: (tx, providerId, data) => tx.provider.update({ where: { id: providerId }, data }),

  refreshReputation: (providerId, client) => {
    const prismaClient = client || prisma;
    return prismaClient.provider.update({ where: { id: providerId }, data: {} });
  },

  getAll: (args) => prisma.provider.findMany(args),
  count: (where) => prisma.provider.count({ where }),
  aggregate: (args) => prisma.provider.aggregate(args),
  getDistinctServiceNames: (providerId) => prisma.providerService.findMany({
    where: { providerId },
    select: { service: { select: { name: true } } },
  }),
};
