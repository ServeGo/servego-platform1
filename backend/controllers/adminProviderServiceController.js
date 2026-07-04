import prisma from '../prisma/client.js';
import { refreshAllProviderReputations, refreshProviderReputation } from '../services/providerReputationService.js';
import { notifyServiceApproved, notifyServiceDenied } from '../services/notificationService.js';
import { writeAuditLog } from '../services/auditLogService.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';

const normalize = (s) => (s || '').toString().trim().toLowerCase();

export const AdminProviderServiceController = {
  getPendingRequests: async (req, res) => {
    try {
      const requests = await prisma.providerServiceRequest.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        include: {
          provider: {
            include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } } }
          }
        }
      });
      res.json(requests);
    } catch (err) {
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch provider service requests', err.message);
    }
  },

  approveService: async (req, res) => {
    try {
      const { id } = req.params;

      const request = await prisma.providerServiceRequest.findUnique({
        where: { id },
        include: { provider: { include: { user: true } } }
      });
      if (!request) return sendApiError(res, 404, 'NOT_FOUND', 'Service request not found.');

      const wasAlreadyApproved = request.status === 'APPROVED';
      const requestedName = request.requestedServiceName;
      const nameNormalized = normalize(requestedName);

      let service = await prisma.service.findUnique({ where: { nameNormalized } });
      if (!service) {
        service = await prisma.service.create({
          data: {
            name: requestedName,
            nameNormalized,
            description: request.description,
            popularIssues: Array.isArray(request.popularIssues) ? request.popularIssues : [],
            isHidden: false
          }
        });
      }

      const existingLink = await prisma.providerService.findFirst({
        where: {
          OR: [
            { providerServiceRequestId: request.id },
            { providerId: request.providerId, serviceId: service.id }
          ]
        }
      });

      const link = existingLink || await prisma.providerService.create({
        data: {
          providerId: request.providerId,
          serviceId: service.id,
          description: request.description,
          providerServiceRequestId: request.id
        }
      });

      await prisma.providerServiceRequest.update({ where: { id }, data: { status: 'APPROVED' } });
      await refreshProviderReputation(request.providerId);

      if (!wasAlreadyApproved && request?.provider?.user?.id) {
        await notifyServiceApproved(request.provider.user.id, requestedName);
      }

      await writeAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'APPROVE_SERVICE_REQUEST',
        targetType: 'ProviderServiceRequest',
        targetId: id,
        oldValue: { status: request.status },
        newValue: { status: 'APPROVED' },
        ip: req.ip
      });

      sendApiSuccess(res, 200, { requestId: request.id, serviceId: service.id, providerServiceId: link.id });
    } catch (err) {
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to approve service request', err.message);
    }
  },

  denyService: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};

      if (!reason || !String(reason).trim()) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing required field: reason.');
      }

      const request = await prisma.providerServiceRequest.findUnique({
        where: { id },
        include: { provider: { include: { user: true } } }
      });
      if (!request) return sendApiError(res, 404, 'NOT_FOUND', 'Service request not found.');

      await prisma.providerServiceRequest.update({
        where: { id },
        data: { status: 'DENIED', denialReason: String(reason).trim() }
      });

      if (request?.provider?.user?.id) {
        await notifyServiceDenied(request.provider.user.id, request.requestedServiceName, String(reason).trim());
      }

      await writeAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'DENY_SERVICE_REQUEST',
        targetType: 'ProviderServiceRequest',
        targetId: id,
        oldValue: { status: request.status },
        newValue: { status: 'DENIED', denialReason: String(reason).trim() },
        ip: req.ip
      });

      sendApiSuccess(res, 200, { requestId: request.id });
    } catch (err) {
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to deny service request', err.message);
    }
  },

  refreshReputation: async (req, res) => {
    try {
      const providers = await refreshAllProviderReputations();
      sendApiSuccess(res, 200, { providersUpdated: providers.filter(Boolean).length });
    } catch (err) {
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to refresh provider reputation', err.message);
    }
  }
};
