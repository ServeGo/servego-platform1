import { ProviderRepository } from '../repositories/provider.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { ReviewRepository, TicketRepository, PaymentRepository, NotificationRepository, ProviderServiceRequestRepository, ProviderServiceLinkRepository, ServiceRepository } from '../repositories/index.js';
import { BadRequestError, NotFoundError, ConflictError } from '../errors/ApiError.js';
import { refreshAllProviderReputations, refreshProviderReputation } from './providerReputationService.js';
import { notifyServiceApproved, notifyServiceDenied } from './notificationService.js';
import { writeAuditLog } from './auditLogService.js';

const normalize = (s) => (s || '').toString().trim().toLowerCase();

const VALID_STATUSES = ['ACTIVE', 'ON_HOLD', 'BLOCKED'];

export const AdminService = {
  async getSummary() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalProviders,
      totalCustomers,
      totalUsers,
      activeBookings,
      pendingBookings,
      confirmedBookings,
      ongoingBookings,
      completedBookings,
      cancelledBookings,
      pendingApprovals,
      completedThisMonth,
      completedLastMonth,
      pendingPayments,
      openTickets,
      resolvedTickets,
      totalPayments,
      paidPayments,
      failedPayments,
      recentSignups,
      verifiedProviders,
      featuredProviders,
      totalReviews,
      avgProviderRating
    ] = await Promise.all([
      ProviderRepository.count(),
      UserRepository.count({ role: 'customer' }),
      UserRepository.count(),

      BookingRepository.count({ status: { in: ['PENDING', 'CONFIRMED', 'ONGOING'] } }),
      BookingRepository.count({ status: 'PENDING' }),
      BookingRepository.count({ status: 'CONFIRMED' }),
      BookingRepository.count({ status: 'ONGOING' }),
      BookingRepository.count({ status: 'COMPLETED' }),
      BookingRepository.count({ status: 'CANCELLED' }),

      ProviderServiceRequestRepository.count({ status: 'PENDING' }),

      BookingRepository.count({ status: 'COMPLETED', createdAt: { gte: monthStart } }),
      BookingRepository.count({
        status: 'COMPLETED',
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd
        }
      }),

      BookingRepository.count({ paymentStatus: 'PENDING' }),

      TicketRepository.count({ status: 'OPEN' }),
      TicketRepository.count({ status: 'RESOLVED' }),

      PaymentRepository.count(),
      PaymentRepository.count({ status: 'PAID' }),
      PaymentRepository.count({ status: 'FAILED' }),

      UserRepository.count({
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }),

      ProviderRepository.count({ isVerified: true }),
      ProviderRepository.count({ isFeatured: true }),

      ReviewRepository.count(),
      ProviderRepository.aggregate({
        _avg: { rating: true }
      })
    ]);

    const bookingGrowth = completedLastMonth > 0
      ? ((completedThisMonth - completedLastMonth) / completedLastMonth * 100).toFixed(1)
      : completedThisMonth > 0 ? 100 : 0;

    const summary = {
      users: {
        total: totalUsers,
        customers: totalCustomers,
        providers: totalProviders,
        verifiedProviders,
        featuredProviders,
        recentSignups
      },
      bookings: {
        active: activeBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        ongoing: ongoingBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        completedThisMonth,
        completedLastMonth,
        growth: parseFloat(bookingGrowth)
      },
      payments: {
        total: totalPayments,
        paid: paidPayments,
        failed: failedPayments,
        pending: pendingPayments
      },
      tickets: {
        open: openTickets,
        resolved: resolvedTickets
      },
      services: {
        pendingApprovals
      },
      quality: {
        totalReviews,
        averageRating: avgProviderRating?._avg?.rating?.toFixed(1) || 0
      }
    };

    const [escrowAgg, disputedTickets] = await Promise.all([
      BookingRepository.aggregateAmount({ paymentStatus: { in: ['PENDING', 'PAID'] } }),
      TicketRepository.count({
        status: 'OPEN', subject: { contains: 'dispute', mode: 'insensitive' }
      })
    ]);

    const sumAmount = escrowAgg?._sum?.amount ?? 0;

    summary.aggregates = {
      grossEscrowVolume: Number(sumAmount),
      adminNetPayout: Number(sumAmount),
      vettingBacklogCount: pendingApprovals,
      disputeTicketsCount: disputedTickets
    };

    return summary;
  },

  async getAnalytics(period = '30d') {
    if (!['7d', '30d', '90d'].includes(period)) {
      throw new BadRequestError('INVALID_PERIOD', 'period must be one of: 7d, 30d, 90d.');
    }

    let startDate = new Date();
    if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    }

    const [bookingsByDay, topProviders, topServices, ratings] = await Promise.all([
      BookingRepository.groupBy({
        by: ['status'],
        _count: true,
        where: { createdAt: { gte: startDate } }
      }),
      BookingRepository.groupBy({
        by: ['providerId'],
        _count: true,
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        orderBy: { _count: { providerId: 'desc' } },
        take: 10
      }),
      BookingRepository.groupBy({
        by: ['serviceCategory'],
        _count: true,
        where: { createdAt: { gte: startDate } },
        orderBy: { _count: { serviceCategory: 'desc' } },
        take: 10
      }),
      ReviewRepository.findManyForRating({ createdAt: { gte: startDate } })
    ]);

    const ratingDistribution = {
      5: ratings.filter(r => r.rating === 5).length,
      4: ratings.filter(r => r.rating === 4).length,
      3: ratings.filter(r => r.rating === 3).length,
      2: ratings.filter(r => r.rating === 2).length,
      1: ratings.filter(r => r.rating === 1).length
    };

    return {
      period,
      startDate,
      bookingsByStatus: bookingsByDay,
      topProviders,
      topServices,
      ratingDistribution,
      totalReviewsThisPeriod: ratings.length
    };
  },

  async getPendingRequests(status = 'PENDING') {
    const requestedStatus = String(status || 'PENDING').toUpperCase();
    if (!['PENDING', 'APPROVED', 'DENIED', 'REJECTED'].includes(requestedStatus)) {
      throw new BadRequestError('INVALID_STATUS', 'status must be PENDING, APPROVED, DENIED, or REJECTED.');
    }
    return ProviderServiceRequestRepository.findMany({
      where: { status: requestedStatus },
      orderBy: { createdAt: 'desc' },
      include: {
        provider: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, avatar: true } }
          }
        }
      }
    });
  },

  async approveService(id, userId, userRole, ip, io) {
    const request = await ProviderServiceRequestRepository.findUnique(
      { id },
      { provider: { include: { user: true } } }
    );
    if (!request) throw new NotFoundError('NOT_FOUND', 'Service request not found.');
    if (request.status !== 'PENDING' && request.status !== 'APPROVED') {
      throw new ConflictError('INVALID_STATE', 'Only pending service requests can be approved.');
    }

    const wasAlreadyApproved = request.status === 'APPROVED';
    const requestedName = request.requestedServiceName;
    const nameNormalized = normalize(requestedName);

    const service = await ServiceRepository.findUnique(
      { nameNormalized },
      { id: true }
    );

    if (!service) {
      throw new BadRequestError(
        'SERVICE_NOT_FOUND',
        `Service '${requestedName}' was not found. Admin must approve against an existing Service.`
      );
    }

    const link = await ProviderServiceLinkRepository.upsert(
      { providerId: request.providerId, serviceId: service.id },
      {
        description: request.description,
        providerServiceRequestId: request.id
      },
      {
        providerId: request.providerId,
        serviceId: service.id,
        description: request.description,
        providerServiceRequestId: request.id
      }
    );

    await ProviderServiceRequestRepository.update(
      { id },
      {
        status: 'APPROVED',
        reviewedBy: userId,
        reviewedAt: new Date()
      }
    );
    await refreshProviderReputation(request.providerId);

    if (!wasAlreadyApproved && request?.provider?.user?.id) {
      await notifyServiceApproved(request.provider.user.id, requestedName);
      if (io) {
        io.emit('serviceApproved', { serviceId: service.id, serviceName: requestedName });
        io.to(`user:${request.provider.user.id}`).emit('providerService:approved', { providerServiceRequestId: request.id, serviceId: service.id });
        io.emit('category:activeCountChanged', { serviceId: service.id });
      }
    }

    await writeAuditLog({
      actorId: userId,
      actorRole: userRole,
      action: 'APPROVE_SERVICE_REQUEST',
      targetType: 'ProviderServiceRequest',
      targetId: id,
      oldValue: { status: request.status },
      newValue: { status: 'APPROVED' },
      ip
    });

    return { requestId: request.id, serviceId: service.id, providerServiceId: link.id };
  },

  async denyService(id, reason, userId, userRole, ip, io) {
    if (!reason || !String(reason).trim()) {
      throw new BadRequestError('MISSING_FIELDS', 'Missing required field: reason.');
    }

    const request = await ProviderServiceRequestRepository.findUnique(
      { id },
      { provider: { include: { user: true } } }
    );
    if (!request) throw new NotFoundError('NOT_FOUND', 'Service request not found.');
    if (request.status !== 'PENDING') {
      throw new ConflictError('INVALID_STATE', 'Only pending service requests can be denied.');
    }

    await ProviderServiceRequestRepository.update(
      { id },
      {
        status: 'DENIED',
        denialReason: String(reason).trim(),
        reviewedBy: userId,
        reviewedAt: new Date()
      }
    );

    if (request?.provider?.user?.id) {
      await notifyServiceDenied(request.provider.user.id, request.requestedServiceName, String(reason).trim());
      if (io) io.to(`user:${request.provider.user.id}`).emit('providerService:rejected', { providerServiceRequestId: request.id });
    }

    await writeAuditLog({
      actorId: userId,
      actorRole: userRole,
      action: 'DENY_SERVICE_REQUEST',
      targetType: 'ProviderServiceRequest',
      targetId: id,
      oldValue: { status: request.status },
      newValue: { status: 'DENIED', denialReason: String(reason).trim() },
      ip
    });

    return { requestId: request.id };
  },

  async refreshReputation() {
    const providers = await refreshAllProviderReputations();
    return { providersUpdated: providers.filter(Boolean).length };
  },

  async setStatus(id, status, reason, userId, userRole, ip, io) {
    if (!status || !VALID_STATUSES.includes(status)) {
      throw new BadRequestError('INVALID_STATUS', `status must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    if (!reason || !String(reason).trim()) {
      throw new BadRequestError('MISSING_FIELDS', 'A reason is required when changing provider account status.');
    }

    const provider = await ProviderRepository.findById(id, {
      include: { user: { select: { id: true, name: true } } }
    });
    if (!provider) throw new NotFoundError('NOT_FOUND', 'Provider not found.');

    const oldStatus = provider.accountStatus;
    if (oldStatus === status) {
      throw new BadRequestError('NO_CHANGE', `Provider is already ${status}.`);
    }

    await ProviderRepository.update(id, { accountStatus: status });

    const statusLabel = { ACTIVE: 'reactivated', ON_HOLD: 'placed on hold', BLOCKED: 'blocked' }[status];
    await NotificationRepository.create({
      userId: provider.user.id,
      title: 'Account Status Updated',
      message: `Your provider account has been ${statusLabel}. Reason: ${String(reason).trim()}`,
      type: 'ACCOUNT'
    });

    await writeAuditLog({
      actorId: userId,
      actorRole: userRole,
      action: `SET_PROVIDER_STATUS_${status}`,
      targetType: 'Provider',
      targetId: id,
      oldValue: { accountStatus: oldStatus },
      newValue: { accountStatus: status, reason: String(reason).trim() },
      ip
    });

    if (io) {
      io.to(`user:${provider.user.id}`).emit('accountStatusChanged', { status, reason });
    }

    return { providerId: id, accountStatus: status };
  },

  async getServiceItems() {
    const [pendingRequests, approvedLinks] = await Promise.all([
      ProviderServiceRequestRepository.findMany({
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

      ProviderServiceLinkRepository.findMany({
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
      experienceYears: null,
      createdAt: link.createdAt,
      approvalStatus: 'APPROVED'
    }));

    return [...pendingMapped, ...approvedMapped].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
};
