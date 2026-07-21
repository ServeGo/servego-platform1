import { ServiceRepository, ProviderServiceLinkRepository } from '../repositories/index.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { BadRequestError, NotFoundError, ConflictError } from '../errors/ApiError.js';

const normalize = (s) => (s || '').toString().trim().toLowerCase();

export const CategoryService = {
  async getAll(query = {}) {
    if (String(query?.query || '').trim() || String(query?.location || '').trim() || String(query?.category || '').trim()) {
      return this.search(query);
    }

    const services = await ServiceRepository.findMany({ where: { isHidden: false } });

    const counts = await ServiceRepository.groupByServiceId({
      provider: {
        accountStatus: 'ACTIVE',
        isVerified: true,
        user: { status: 'ACTIVE' }
      }
    });
    const countMap = Object.fromEntries(counts.map(c => [c.serviceId, c._count.providerId]));

    return services.map(s => ({ ...s, activeSpecialistCount: countMap[s.id] || 0 }));
  },

  async search(query = {}) {
    const { query: q = '', location = '', category = '' } = query;
    const trimmed = String(q).trim();

    const where = { isHidden: false };
    if (trimmed) {
      where.OR = [
        { name: { contains: trimmed, mode: 'insensitive' } },
        { description: { contains: trimmed, mode: 'insensitive' } }
      ];
    }
    if (String(category).trim()) {
      where.AND = [{
        OR: [
          { id: String(category).trim() },
          { name: { equals: String(category).trim(), mode: 'insensitive' } },
          { nameNormalized: String(category).trim().toLowerCase() }
        ]
      }];
    }

    const services = await ServiceRepository.findMany({ where });

    const counts = await ServiceRepository.groupByServiceId({
      provider: {
        accountStatus: 'ACTIVE',
        isVerified: true,
        user: { status: 'ACTIVE' },
        ...(location ? { serviceAreas: { array_contains: location } } : {})
      }
    });
    const countMap = Object.fromEntries(counts.map(c => [c.serviceId, c._count.providerId]));

    return services.map(s => ({ ...s, activeSpecialistCount: countMap[s.id] || 0 }));
  },

  async getCategoryBySlug(slug, query = {}) {
    const slugStr = String(slug || '').trim();
    const normalized = slugStr.replace(/-/g, ' ').toLowerCase();
    const category = await ServiceRepository.findFirst({
      where: {
        isHidden: false,
        OR: [
          { nameNormalized: normalized },
          { name: { equals: slugStr.replace(/-/g, ' '), mode: 'insensitive' } }
        ]
      }
    });
    if (!category) throw new NotFoundError('NOT_FOUND', 'Service category not found.');

    const location = String(query.zone || '').trim();
    const providers = await ProviderServiceLinkRepository.findMany({
      where: {
        serviceId: category.id,
        provider: {
          accountStatus: 'ACTIVE',
          isVerified: true,
          user: { status: 'ACTIVE' },
          ...(location ? { serviceAreas: { array_contains: location } } : {})
        }
      },
      include: {
        provider: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            badges: true
          }
        }
      },
      orderBy: { provider: String(query.sort) === 'experience' ? { experienceYears: 'desc' } : { rating: 'desc' } }
    });

    return {
      category,
      activeSpecialistCount: providers.length,
      providers: providers.map(({ provider, description }) => ({ ...provider, serviceDescription: description }))
    };
  },

  async getActiveCount(id) {
    const service = await ServiceRepository.findUnique({ id }, { id: true });
    if (!service) throw new NotFoundError('NOT_FOUND', 'Service category not found.');

    const activeSpecialistCount = await ServiceRepository.providerServiceCount({
      serviceId: service.id,
      provider: { accountStatus: 'ACTIVE', isVerified: true, user: { status: 'ACTIVE' } }
    });

    return { serviceId: service.id, activeSpecialistCount };
  },

  async create(data) {
    const { name, description, popularIssues } = data;
    if (!name) throw new BadRequestError('MISSING_FIELDS', 'Missing required field: name');

    const nameNormalized = normalize(name);
    const existing = await ServiceRepository.findUnique({ nameNormalized });
    if (existing) {
      throw new ConflictError('DUPLICATE_ENTRY', 'A service with this name already exists');
    }

    try {
      return await ServiceRepository.create({
        name,
        nameNormalized,
        description: description || '',
        popularIssues: Array.isArray(popularIssues) ? popularIssues : []
      });
    } catch (err) {
      if (err.code === 'P2002') {
        throw new ConflictError('DUPLICATE_ENTRY', 'A service with this name already exists');
      }
      throw err;
    }
  },

  async deleteOne(id, confirm) {
    if (!id) throw new BadRequestError('MISSING_FIELDS', 'Missing service id');

    const [service, activeProviders, bookings] = await Promise.all([
      ServiceRepository.findUnique({ id }, { id: true }),
      ServiceRepository.providerServiceCount({ serviceId: id, provider: { accountStatus: 'ACTIVE' } }),
      BookingRepository.count({ serviceId: id, status: { in: ['PENDING', 'CONFIRMED', 'ONGOING'] } })
    ]);
    if (!service) throw new NotFoundError('NOT_FOUND', 'Service not found');
    if (activeProviders || bookings) {
      throw new ConflictError('CATEGORY_IN_USE', 'Reassign active providers and bookings before deleting this category.', { activeProviders, activeBookings: bookings });
    }
    if (String(confirm) !== 'true') {
      throw new BadRequestError('CONFIRMATION_REQUIRED', 'Set confirm=true after verifying this category is safe to delete.');
    }

    await ServiceRepository.delete({ id });
    return { message: 'Service deleted successfully' };
  },

  async updateOne(id, data) {
    if (!id) throw new BadRequestError('MISSING_FIELDS', 'Missing service id');

    const { name, description, popularIssues } = data || {};
    if (!name) throw new BadRequestError('MISSING_FIELDS', 'Missing required field: name');

    try {
      return await ServiceRepository.update(
        { id },
        {
          name,
          nameNormalized: normalize(name),
          description: description || '',
          popularIssues: Array.isArray(popularIssues) ? popularIssues : []
        }
      );
    } catch (err) {
      if (err.code === 'P2025') {
        throw new NotFoundError('NOT_FOUND', 'Service not found');
      }
      throw err;
    }
  },

  async hideOne(id, isHidden) {
    if (!id) throw new BadRequestError('MISSING_FIELDS', 'Missing service id');

    if (![true, false, 'true', 'false'].includes(isHidden)) {
      throw new BadRequestError('INVALID_VALUE', 'isHidden must be true or false.');
    }

    try {
      return await ServiceRepository.update(
        { id },
        {
          isHidden: isHidden === true || isHidden === 'true'
        }
      );
    } catch (err) {
      if (err.code === 'P2025') {
        throw new NotFoundError('NOT_FOUND', 'Service not found');
      }
      throw err;
    }
  }
};
