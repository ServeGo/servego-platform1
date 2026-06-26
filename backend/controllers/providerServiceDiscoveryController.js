import prisma from '../prisma/client.js';

export const ProviderServiceDiscoveryController = {
  // Returns providers who have an APPROVED ProviderService link for the given Service name.
  // Used for customer-facing category sectors (Plumber/Electrician etc.).
  getApprovedProvidersByServiceName: async (req, res) => {
    try {
      const rawServiceName = req.query?.serviceName;
      if (!rawServiceName || !String(rawServiceName).trim()) {
        return res.status(400).json({ error: 'Missing required query: serviceName' });
      }

      const serviceName = String(rawServiceName).trim();

      // Note: We filter Approved via providerService rows existing.
      // (There is no approvalStatus field on ProviderService; approval implies the link exists.)
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

      res.json(formatted);
    } catch (err) {
      res.status(500).json({ error: 'Failed to discover approved providers', details: err.message });
    }
  }
};

function linkSafeCategory(_provider, requestedServiceName) {
  // Keep UI consistent with existing category string comparisons.
  return requestedServiceName;
}

