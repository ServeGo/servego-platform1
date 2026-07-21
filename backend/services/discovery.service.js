import { ServiceRepository, ProviderServiceLinkRepository } from '../repositories/index.js';
import { BadRequestError, NotFoundError } from '../errors/ApiError.js';

function linkSafeCategory(_provider, requestedServiceName) {
  return requestedServiceName;
}

export const DiscoveryService = {
  async getByCategory(slug, query = {}) {
    const slugName = String(slug || '').replace(/-/g, ' ').trim();
    const normalized = slugName.toLowerCase();
    const service = await ServiceRepository.findFirst(
      {
        isHidden: false,
        OR: [
          { nameNormalized: normalized },
          { name: { equals: slugName, mode: 'insensitive' } }
        ]
      },
      { name: true }
    );
    if (!service) throw new NotFoundError('NOT_FOUND', 'Service category not found.');

    const mergedQuery = { ...query, serviceName: service.name, location: query.zone || query.location || '' };
    return this.getByServiceName(mergedQuery);
  },

  async getByServiceName(query = {}) {
    const rawServiceName = query?.serviceName;
    if (!rawServiceName || !String(rawServiceName).trim()) {
      throw new BadRequestError('MISSING_FIELDS', 'Missing required query: serviceName');
    }

    const serviceName = String(rawServiceName).trim();
    const location = String(query?.location || '').trim();
    const sort = String(query?.sort || 'rating').trim();

    const orderBy = sort === 'experience'
      ? { experienceYears: 'desc' }
      : { rating: 'desc' };

    const providerServices = await ProviderServiceLinkRepository.findMany({
      where: {
        service: {
          name: { equals: serviceName, mode: 'insensitive' }
        },
        provider: {
          accountStatus: 'ACTIVE',
          isVerified: true,
          user: { status: 'ACTIVE' },
          ...(location ? { serviceAreas: { array_contains: location } } : {})
        }
      },
      orderBy: { provider: orderBy },
      include: {
        provider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true
              }
            },
            reviews: true,
            badges: true
          }
        },
        service: true
      }
    });

    const unique = new Map();
    for (const link of providerServices) {
      const p = link.provider;
      if (!p) continue;
      if (!unique.has(p.id)) unique.set(p.id, { provider: p, link });
    }

    return Array.from(unique.values()).map(({ provider: p, link }) => ({
      id: p.id,
      userId: p.userId,
      name: p.user?.name || 'Unknown',
      avatar: p.photo || p.user?.avatar || null,
      category: linkSafeCategory(p, serviceName),
      rating: p.rating,
      reviewCount: p.reviewCount,
      experienceYears: p.experienceYears,
      serviceDescription: link.description || p.bio,
      specialties: Array.isArray(p.specialties) ? p.specialties : [],
      serviceAreas: Array.isArray(p.serviceAreas) ? p.serviceAreas : [],
      isVerified: p.isVerified,
      verificationLevel: p.verificationLevel,
      badges: p.badges || [],
      reviews: p.reviews || []
    }));
  }
};
