import prisma from '../prisma/client.js';
import { refreshProviderReputation } from '../services/providerReputationService.js';
import { canPerformAction } from '../utils/permissions.js';
import { writeAuditLog } from '../services/auditLogService.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';

export const ProviderController = {
  getProviderServices: async (req, res) => {
    try {
      const { id } = req.params;

      const [approvedLinks, requests] = await Promise.all([
        prisma.providerService.findMany({
          where: { providerId: id },
          include: { service: true },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.providerServiceRequest.findMany({
          where: {
            providerId: id,
            status: { not: 'APPROVED' }
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      const uniqueApprovedLinks = Array.from(
        new Map(approvedLinks.map((link) => [link.serviceId, link])).values()
      );

      const formattedApproved = uniqueApprovedLinks.map((link) => ({
        id: link.id,
        name: link.service.name,
        approvalStatus: 'APPROVED',
        description: link.description,
        createdAt: link.createdAt
      }));

      const approvedNameSet = new Set(
        uniqueApprovedLinks.map((link) => String(link.service.name || '').trim().toLowerCase())
      );

      const formattedRequests = requests
        .filter((r) => {
          const requestedNameNormalized = String(r.requestedServiceName || '').trim().toLowerCase();
          return !approvedNameSet.has(requestedNameNormalized);
        })
        .map((r) => ({
          id: r.id,
          name: r.requestedServiceName,
          approvalStatus: r.status,
          description: r.description,
          createdAt: r.createdAt
        }));

      const combined = [...formattedApproved, ...formattedRequests].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return sendApiSuccess(res, 200, combined);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch provider services', err.message);
    }
  },

  registerProviderService: async (req, res) => {
    try {
      const { id } = req.params;
      const { serviceName, description, popularIssues, experienceYears } = req.body || {};
      const role = req.user?.role || req.body?.role || 'provider';

      if (!req.user?.id && role !== 'admin') {
        return sendApiError(res, 401, 'UNAUTHORIZED', 'Authentication required.');
      }

      if (role !== 'provider' && role !== 'admin') {
        return sendApiError(res, 403, 'FORBIDDEN', 'You are not allowed to register a provider service.');
      }

      if (!serviceName) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing required field: serviceName');
      }
      if (!description || !String(description).trim()) {
        return sendApiError(res, 400, 'MISSING_FIELDS', 'Missing required field: description');
      }

      const provider = await prisma.provider.findUnique({ where: { id } });
      if (!provider) return sendApiError(res, 404, 'NOT_FOUND', 'Service provider not found');
      if (role !== 'admin' && provider.userId !== req.user?.id) {
        return sendApiError(res, 403, 'FORBIDDEN', 'You can only manage your own provider profile.');
      }

      const requestedService = String(serviceName).trim();

      const existingApproved = await prisma.providerService.findFirst({
        where: {
          providerId: provider.id,
          service: {
            name: { equals: requestedService, mode: 'insensitive' }
          }
        },
        select: { id: true }
      });
      if (existingApproved) {
        return sendApiError(res, 409, 'DUPLICATE_ENTRY', 'Service already registered for this provider.');
      }

      const existingPending = await prisma.providerServiceRequest.findFirst({
        where: {
          providerId: provider.id,
          requestedServiceName: { equals: requestedService, mode: 'insensitive' },
          status: 'PENDING'
        },
        select: { id: true }
      });
      if (existingPending) {
        return sendApiError(res, 409, 'DUPLICATE_ENTRY', 'Service request already pending approval.');
      }

      const existingRequest = await prisma.providerServiceRequest.findFirst({
        where: {
          providerId: provider.id,
          requestedServiceName: { equals: requestedService, mode: 'insensitive' }
        },
        select: { status: true }
      });

      if (existingRequest && existingRequest.status !== 'DENIED') {
        return sendApiError(res, 409, 'DUPLICATE_ENTRY', 'Service request already submitted for this provider.');
      }

      const created = await prisma.providerServiceRequest.create({
        data: {
          providerId: provider.id,
          requestedServiceName: requestedService,
          description: String(description).trim(),
          popularIssues: Array.isArray(popularIssues) ? popularIssues : [],
          experienceYears:
            experienceYears !== undefined && experienceYears !== null && experienceYears !== ''
              ? Number(experienceYears)
              : null,
          status: 'PENDING'
        }
      });

      if (
        experienceYears !== undefined &&
        experienceYears !== null &&
        experienceYears !== '' &&
        !Number.isNaN(Number(experienceYears))
      ) {
        await prisma.provider.update({
          where: { id },
          data: { experienceYears: Number(experienceYears) }
        });
      }

      return sendApiSuccess(res, 201, created);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to register provider service', err.message);
    }
  },


  getAll: async (req, res) => {
    try {
      const providers = await prisma.provider.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, avatar: true }
          },
          reviews: true,
          badges: true
        }
      });
      return sendApiSuccess(res, 200, providers);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to fetch service partners', err.message);
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const provider = await prisma.provider.findUnique({
        where: { id },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true, avatar: true }
          },
          reviews: true,
          badges: true
        }
      });
      if (!provider) {
        return sendApiError(res, 404, 'NOT_FOUND', 'Service provider not found');
      }
      return sendApiSuccess(res, 200, provider);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve provider details', err.message);
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const { bio, specialties, serviceAreas, experienceYears, phone, isVerified } = req.body;

      const existing = await prisma.provider.findUnique({ where: { id } });
      if (!existing) {
        return sendApiError(res, 404, 'NOT_FOUND', 'Service provider profile missing');
      }

      const updated = await prisma.provider.update({
        where: { id },
        data: {
          bio: bio ?? existing.bio,
          specialties: Array.isArray(specialties) ? specialties : existing.specialties,
          serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : existing.serviceAreas,
          experienceYears: Number.isFinite(Number(experienceYears)) ? Number(experienceYears) : existing.experienceYears,
          isVerified: typeof isVerified === 'boolean' ? isVerified : existing.isVerified
        },
        include: { reviews: true }
      });

      return sendApiSuccess(res, 200, updated);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to update partner profile', err.message);
    }
  },


  updateAvailability: async (req, res) => {
    try {
      const { id } = req.params;
      const { availableDays, timeSlots } = req.body;

      const updated = await prisma.provider.update({
        where: { id },
        data: {
          availableDays: Array.isArray(availableDays) ? availableDays : undefined,
          timeSlots: Array.isArray(timeSlots) ? timeSlots : undefined
        }
      });
      return sendApiSuccess(res, 200, updated);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to update calendar availability schedule', err.message);
    }
  },

  verify: async (req, res) => {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;

      const existing = await prisma.provider.findUnique({ where: { id }, select: { isVerified: true } });
      if (!existing) return sendApiError(res, 404, 'NOT_FOUND', 'Provider not found.');

      await prisma.provider.update({ where: { id }, data: { isVerified: Boolean(isVerified) } });
      const updated = await refreshProviderReputation(id);

      await writeAuditLog({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: isVerified ? 'VERIFY_PROVIDER' : 'UNVERIFY_PROVIDER',
        targetType: 'Provider',
        targetId: id,
        oldValue: { isVerified: existing.isVerified },
        newValue: { isVerified: Boolean(isVerified) },
        ip: req.ip
      });

      return sendApiSuccess(res, 200, updated);
    } catch (err) {
      return sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to verify provider credentials', err.message);
    }
  }
};
