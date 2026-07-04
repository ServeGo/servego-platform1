import prisma from '../prisma/client.js';
import { refreshProviderReputation } from '../services/providerReputationService.js';
import { canPerformAction } from '../utils/permissions.js';

export const ProviderController = {
  getProviderServices: async (req, res) => {
    try {
      const { id } = req.params;

      // Provider sees:
      // - approved links (ProviderService)
      // - pending/denied requests (ProviderServiceRequest)
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

      // sort newest first across both arrays
      const combined = [...formattedApproved, ...formattedRequests].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      res.json(combined);
    } catch (err) {
      res.status(500).json({
        error: 'Failed to fetch provider services',
        details: err.message,
        // helps identify if the request providerId is wrong type/value
        providerId: req.params?.id
      });
    }
  },

  registerProviderService: async (req, res) => {
    try {
      const { id } = req.params;
      const { serviceName, description, popularIssues, experienceYears } = req.body || {};
      const role = req.user?.role || req.body?.role || 'provider';

      if (!req.user?.id && role !== 'admin') {
        return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Authentication required.' });
      }

      if (role !== 'provider' && role !== 'admin') {
        return res.status(403).json({ error: 'You are not allowed to register a provider service.' });
      }

      if (!serviceName) {
        return res.status(400).json({ error: 'Missing required field: serviceName' });
      }
      if (!description || !String(description).trim()) {
        return res.status(400).json({ error: 'Missing required field: description' });
      }

      const provider = await prisma.provider.findUnique({ where: { id } });
      if (!provider) return res.status(404).json({ error: 'Service provider not found' });
      if (role !== 'admin' && provider.userId !== req.user?.id) {
        return res.status(403).json({ error: 'You can only manage your own provider profile.' });
      }

      const requestedService = String(serviceName).trim();

      // 1) If already approved for this provider+service -> return 409
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
        return res.status(409).json({ error: 'Service already registered for this provider.' });
      }

      // 2) If already pending for this provider+service -> return 409
      const existingPending = await prisma.providerServiceRequest.findFirst({
        where: {
          providerId: provider.id,
          requestedServiceName: { equals: requestedService, mode: 'insensitive' },
          status: 'PENDING'
        },
        select: { id: true }
      });
      if (existingPending) {
        return res.status(409).json({ error: 'Service request already pending approval.' });
      }

      // 3) If any prior request exists and is not denied -> block
      // (This ensures that ONLY denied requests allow re-submission.)
      const existingRequest = await prisma.providerServiceRequest.findFirst({
        where: {
          providerId: provider.id,
          requestedServiceName: { equals: requestedService, mode: 'insensitive' }
        },
        select: { status: true }
      });

      if (existingRequest && existingRequest.status !== 'DENIED') {
        return res.status(409).json({ error: 'Service request already submitted for this provider.' });
      }

      // Create a provider service request in PENDING state.
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

      // Optionally update experienceYears on provider profile from request
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

      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: 'Failed to register provider service', details: err.message });
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
      res.json(providers);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch service partners', details: err.message });
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
        return res.status(404).json({ error: 'Service provider not found' });
      }
      res.json(provider);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve provider details', details: err.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const { bio, specialties, serviceAreas, experienceYears, phone, isVerified } = req.body;

      const existing = await prisma.provider.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: 'Service provider profile missing' });
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

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update partner profile', details: err.message });
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
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update calendar availability schedule', details: err.message });
    }
  },

  verify: async (req, res) => {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;

      await prisma.provider.update({
        where: { id },
        data: {
          isVerified: Boolean(isVerified)
        }
      });
      const updated = await refreshProviderReputation(id);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Failed to verify provider credentials', details: err.message });
    }
  }
};
