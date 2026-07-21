import { ProviderRepository } from '../repositories/provider.repository.js';
import { ProviderServiceLinkRepository, ProviderServiceRequestRepository, AvailabilitySlotRepository, prisma } from '../repositories/index.js';
import { refreshProviderReputation } from './providerReputationService.js';
import { canPerformAction } from '../utils/permissions.js';
import { writeAuditLog } from './auditLogService.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../errors/ApiError.js';

export const ProviderService = {
  async registerService(providerId, data, user, io) {
    const { serviceName, description, popularIssues, experienceYears } = data;
    const role = user.role;

    if (role !== 'provider' && role !== 'admin') throw new ForbiddenError('FORBIDDEN', 'You are not allowed to register a provider service.');
    if (!serviceName) throw new BadRequestError('MISSING_FIELDS', 'Missing required field: serviceName');
    if (!description || !String(description).trim()) throw new BadRequestError('MISSING_FIELDS', 'Missing required field: description');

    const provider = await ProviderRepository.findById(providerId);
    if (!provider) throw new NotFoundError('NOT_FOUND', 'Service provider not found');
    if (role !== 'admin' && provider.userId !== user.id) throw new ForbiddenError('FORBIDDEN', 'You can only manage your own provider profile.');

    const requestedService = String(serviceName).trim();

    const existingApproved = await ProviderServiceLinkRepository.findFirst(
      { providerId: provider.id, service: { name: { equals: requestedService, mode: 'insensitive' } } },
      { id: true }
    );
    if (existingApproved) throw new ConflictError('DUPLICATE_ENTRY', 'Service already registered for this provider.');

    const existingPending = await ProviderServiceRequestRepository.findFirst(
      { providerId: provider.id, requestedServiceName: { equals: requestedService, mode: 'insensitive' }, status: 'PENDING' },
      { id: true }
    );
    if (existingPending) throw new ConflictError('DUPLICATE_ENTRY', 'Service request already pending approval.');

    const existingRequest = await ProviderServiceRequestRepository.findFirst(
      { providerId: provider.id, requestedServiceName: { equals: requestedService, mode: 'insensitive' } },
      { status: true }
    );
    if (existingRequest && existingRequest.status !== 'DENIED') throw new ConflictError('DUPLICATE_ENTRY', 'Service request already submitted for this provider.');

    const created = await ProviderServiceRequestRepository.create({
      providerId: provider.id, requestedServiceName: requestedService,
      description: String(description).trim(),
      popularIssues: Array.isArray(popularIssues) ? popularIssues : [],
      experienceYears: experienceYears !== undefined && experienceYears !== null && experienceYears !== '' ? Number(experienceYears) : null,
      status: 'PENDING',
    });

    if (io) io.to('room:admin').emit('newApprovalRequest', { requestId: created.id, providerId: provider.id, serviceName: requestedService });

    if (experienceYears !== undefined && experienceYears !== null && experienceYears !== '' && !Number.isNaN(Number(experienceYears))) {
      await ProviderRepository.update(providerId, { experienceYears: Number(experienceYears) });
    }

    return created;
  },

  async getProviderServices(id, user) {
    const provider = await ProviderRepository.findById(id, { select: { userId: true } });
    if (!provider) throw new NotFoundError('NOT_FOUND', 'Service provider not found');
    const canViewRequests = user?.role === 'admin' || user?.id === provider.userId;

    const [approvedLinks, requests] = await Promise.all([
      ProviderRepository.getServices(id),
      ProviderServiceRequestRepository.findMany({
        where: { providerId: id, ...(canViewRequests ? { status: { not: 'APPROVED' } } : { id: '__not_visible__' }) },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const uniqueApprovedLinks = Array.from(new Map(approvedLinks.map((link) => [link.serviceId, link])).values());
    const formattedApproved = uniqueApprovedLinks.map((link) => ({ id: link.id, name: link.service.name, approvalStatus: 'APPROVED', description: link.description, createdAt: link.createdAt }));
    const approvedNameSet = new Set(uniqueApprovedLinks.map((link) => String(link.service.name || '').trim().toLowerCase()));
    const formattedRequests = requests.filter((r) => !approvedNameSet.has(String(r.requestedServiceName || '').trim().toLowerCase()))
      .map((r) => ({ id: r.id, name: r.requestedServiceName, approvalStatus: r.status, description: r.description, createdAt: r.createdAt }));

    return [...formattedApproved, ...formattedRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async updateProfile(id, data, user) {
    const { bio, specialties, serviceAreas, experienceYears, phone } = data;
    const existing = await ProviderRepository.findById(id);
    if (!existing) throw new NotFoundError('NOT_FOUND', 'Service provider profile missing');
    if (user.role !== 'admin' && existing.userId !== user.id) throw new ForbiddenError('FORBIDDEN', 'You can only update your own provider profile.');

    const nextBio = bio ?? existing.bio;
    const nextSpecialties = Array.isArray(specialties) ? specialties : existing.specialties;
    const nextAreas = Array.isArray(serviceAreas) ? serviceAreas : existing.serviceAreas;
    const profileComplete = Boolean(String(nextBio || '').trim() && Array.isArray(nextSpecialties) && nextSpecialties.length && Array.isArray(nextAreas) && nextAreas.length);

    return prisma.$transaction(async (tx) => {
      if (phone !== undefined) await tx.user.update({ where: { id: existing.userId }, data: { phone: String(phone).trim() } });
      return tx.provider.update({
        where: { id }, data: { bio: nextBio, specialties: nextSpecialties, serviceAreas: nextAreas, experienceYears: Number.isFinite(Number(experienceYears)) ? Number(experienceYears) : existing.experienceYears, profileComplete },
        include: { reviews: true, user: { select: { id: true, name: true, email: true, phone: true, avatar: true } } },
      });
    });
  },

  async updateAvailability(id, data, user) {
    const { availableDays, timeSlots, availabilitySlots } = data;
    const provider = await ProviderRepository.findById(id, { select: { userId: true } });
    if (!provider) throw new NotFoundError('NOT_FOUND', 'Service provider profile missing');
    if (user.role !== 'admin' && provider.userId !== user.id) throw new ForbiddenError('FORBIDDEN', 'You can only update your own availability.');

    const slots = Array.isArray(availabilitySlots)
      ? availabilitySlots.map((slot) => ({ dayOfWeek: String(slot?.dayOfWeek || '').trim(), startTime: String(slot?.startTime || '').trim(), endTime: String(slot?.endTime || '').trim() }))
      : null;

    if (slots) {
      if (slots.some((slot) => !slot.dayOfWeek || !/^\d{2}:\d{2}$/.test(slot.startTime) || !/^\d{2}:\d{2}$/.test(slot.endTime) || slot.startTime >= slot.endTime)) {
        throw new BadRequestError('INVALID_AVAILABILITY', 'Each slot needs a day and valid start/end times (HH:MM).');
      }
      const ordered = [...slots].sort((a, b) => a.dayOfWeek.localeCompare(b.dayOfWeek) || a.startTime.localeCompare(b.startTime));
      if (ordered.some((slot, index) => index > 0 && ordered[index - 1].dayOfWeek === slot.dayOfWeek && ordered[index - 1].endTime > slot.startTime)) {
        throw new ConflictError('OVERLAPPING_AVAILABILITY', 'Availability slots cannot overlap on the same day.');
      }
    }

    return prisma.$transaction(async (tx) => {
      if (slots) {
        await tx.availabilitySlot.deleteMany({ where: { providerId: id } });
        if (slots.length) await tx.availabilitySlot.createMany({ data: slots.map((slot) => ({ ...slot, providerId: id })) });
      }
      return tx.provider.update({
        where: { id },
        data: { availableDays: Array.isArray(availableDays) ? availableDays : undefined, timeSlots: Array.isArray(timeSlots) ? timeSlots : undefined },
        include: { availabilitySlots: true },
      });
    });
  },

  async verify(id, isVerified, user, reqIp) {
    const existing = await ProviderRepository.findById(id, { select: { isVerified: true } });
    if (!existing) throw new NotFoundError('NOT_FOUND', 'Provider not found.');

    await ProviderRepository.update(id, { isVerified: Boolean(isVerified) });
    const updated = await refreshProviderReputation(id);

    await writeAuditLog({
      actorId: user.id, actorRole: user.role,
      action: isVerified ? 'VERIFY_PROVIDER' : 'UNVERIFY_PROVIDER',
      targetType: 'Provider', targetId: id,
      oldValue: { isVerified: existing.isVerified }, newValue: { isVerified: Boolean(isVerified) },
      ip: reqIp,
    });

    return updated;
  },

  async getAll(user) {
    const isAdmin = user?.role === 'admin';
    const publicProviderWhere = { accountStatus: 'ACTIVE', isVerified: true, user: { status: 'ACTIVE' } };
    return ProviderRepository.findMany({
      where: isAdmin ? {} : user?.role === 'provider' ? { OR: [publicProviderWhere, { userId: user.id }] } : publicProviderWhere,
      include: {
        user: { select: isAdmin ? { id: true, name: true, email: true, phone: true, avatar: true } : { id: true, name: true, avatar: true } },
        reviews: true, badges: true,
      },
    });
  },

  async getById(id, user) {
    const isAdmin = user?.role === 'admin';
    const provider = await ProviderRepository.findById(id, {
      include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } }, reviews: true, badges: true, availabilitySlots: true },
    });
    if (!provider) throw new NotFoundError('NOT_FOUND', 'Service provider not found');
    const isOwner = user?.role === 'provider' && provider.userId === user.id;
    if (!isAdmin && !isOwner && (!provider.isVerified || provider.accountStatus !== 'ACTIVE' || provider.user?.status !== 'ACTIVE')) {
      throw new NotFoundError('NOT_FOUND', 'Service provider not found');
    }
    if (!isAdmin && !isOwner && provider.user) { delete provider.user.email; delete provider.user.phone; }
    return provider;
  },
};
