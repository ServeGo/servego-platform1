import prisma from '../prisma/client.js';

const normalize = (s) => (s || '').toString().trim().toLowerCase();

export const AdminProviderServiceController = {
  approveService: async (req, res) => {
    try {
      const { id } = req.params; // ProviderServiceRequest id
      const role = req.body?.role ?? req.query?.role;
      if (role && role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

      const request = await prisma.providerServiceRequest.findUnique({
        where: { id },
        include: {
          provider: {
            include: { user: true }
          }
        }
      });

      if (!request) return res.status(404).json({ error: 'Service request not found' });

      // Mark request approved
      await prisma.providerServiceRequest.update({
        where: { id },
        data: { status: 'APPROVED' }
      });

      // Ensure global service category exists
      const requestedName = request.requestedServiceName;
      const nameNormalized = normalize(requestedName);

      let service = await prisma.service.findUnique({
        where: { nameNormalized }
      });

      if (!service) {
        // This happens only for OTHER entries or for dropdown names not present in db.
        service = await prisma.service.create({
          data: {
            name: requestedName,
            nameNormalized,
            description: request.description,
            basePrice: 0,
            popularIssues: Array.isArray(request.popularIssues) ? request.popularIssues : [],
            isHidden: false
          }
        });
      }

      // Link provider to global service (ProviderService). Enforce 1 link per request.
      await prisma.providerService.create({
        data: {
          providerId: request.providerId,
          serviceId: service.id,
          basePricePerDay: request.basePricePerDay,
          description: request.description,
          providerServiceRequestId: request.id
        }
      });

      // Notify provider
      if (request?.provider?.user?.id) {
        await prisma.notification.create({
          data: {
            userId: request.provider.user.id,
            title: 'Service approved',
            message: `Your service request "${requestedName}" has been approved.`,
            type: 'SERVICE_APPROVAL',
            isRead: false
          }
        });
      }

      res.json({ success: true, requestId: request.id, serviceId: service.id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to approve service request', details: err.message });
    }
  },

  denyService: async (req, res) => {
    try {
      const { id } = req.params; // ProviderServiceRequest id
      const role = req.body?.role ?? req.query?.role;
      if (role && role !== 'admin') return res.status(403).json({ error: 'Admin access required' });

      const { reason } = req.body || {};
      if (!reason || !String(reason).trim()) {
        return res.status(400).json({ error: 'Missing required field: reason' });
      }

      const request = await prisma.providerServiceRequest.findUnique({
        where: { id },
        include: {
          provider: {
            include: { user: true }
          }
        }
      });

      if (!request) return res.status(404).json({ error: 'Service request not found' });

      await prisma.providerServiceRequest.update({
        where: { id },
        data: {
          status: 'DENIED',
          denialReason: String(reason).trim()
        }
      });

      if (request?.provider?.user?.id) {
        await prisma.notification.create({
          data: {
            userId: request.provider.user.id,
            title: 'Service denied',
            message: `Your service request "${request.requestedServiceName}" has been denied.\nReason: ${String(reason).trim()}`,
            type: 'SERVICE_DENIAL',
            isRead: false
          }
        });
      }

      res.json({ success: true, requestId: request.id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to deny service request', details: err.message });
    }
  },

};




