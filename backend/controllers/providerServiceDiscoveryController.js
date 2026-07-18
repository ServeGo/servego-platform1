import prisma from '../prisma/client.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';

export const ProviderServiceDiscoveryController = {
  getApprovedProvidersByServiceName: async (req, res) => {
    try {
      const rawServiceName = req.query?.serviceName;
      if (!rawServiceName || !String(rawServiceName).trim()) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing required query: serviceName');
      }

      const serviceName = String(rawServiceName).trim();

      const providerServices = await prisma.providerService.findMany({
        where: {
          service: {
            name: { equals: serviceName, mode: 'insensitive' }
          },
          provider: {
            isVerified: true,
            user: {
              status: 'ACTIVE'
            }
          }
        },
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

      const formatted = Array.from(unique.values()).map(({ provider: p, link }) => ({
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

      return sendApiSuccess(res, 200, formatted);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to discover approved providers', err.message);
    }
  }
};

function linkSafeCategory(_provider, requestedServiceName) {
  return requestedServiceName;
}

