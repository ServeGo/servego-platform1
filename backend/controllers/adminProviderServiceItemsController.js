import prisma from '../prisma/client.js';

const normalize = (s) => (s || '').toString().trim().toLowerCase();

export const AdminProviderServiceItemsController = {
  getAll: async (req, res) => {
    try {

      const role = req.body?.role ?? req.query?.role;
      if (role && role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

      const [pendingRequests, approvedLinks] = await Promise.all([
        prisma.providerServiceRequest.findMany({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          include: {
            provider: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, phone: true, avatar: true }
                }
              }
            }
          }
        }),

        prisma.providerService.findMany({
          include: {
            provider: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, phone: true, avatar: true }
                }
              }
            },
            service: true
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      const pendingMapped = pendingRequests.map((r) => ({
        type: 'PENDING',
        id: r.id,
        provider: r.provider,
        name: r.requestedServiceName,
        description: r.description,
        basePricePerDay: r.basePricePerDay,
        experienceYears: r.experienceYears,
        createdAt: r.createdAt,
        approvalStatus: r.status
      }));

      const approvedMapped = approvedLinks.map((link) => ({
        type: 'APPROVED',
        id: `APP-${link.id}`,
        provider: link.provider,
        name: link.service.name,
        description: link.description ?? link.service.description,
        basePricePerDay: link.basePricePerDay,
        experienceYears: null,
        createdAt: link.createdAt,
        approvalStatus: 'APPROVED'
      }));

      const combined = [...pendingMapped, ...approvedMapped].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      res.json(combined);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch provider service items', details: err.message });
    }
  }
};

