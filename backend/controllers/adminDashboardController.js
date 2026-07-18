import prisma from '../prisma/client.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';

export const AdminDashboardController = {
  getSummary: async (req, res) => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        // Basic counts
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
        // Provider and customer counts
        prisma.provider.count(),
        prisma.user.count({ where: { role: 'customer' } }),
        prisma.user.count(),
        
        // Booking status counts
        prisma.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'ONGOING'] } } }),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.booking.count({ where: { status: 'CONFIRMED' } }),
        prisma.booking.count({ where: { status: 'ONGOING' } }),
        prisma.booking.count({ where: { status: 'COMPLETED' } }),
        prisma.booking.count({ where: { status: 'CANCELLED' } }),
        
        // Service requests
        prisma.providerServiceRequest.count({ where: { status: 'PENDING' } }),
        
        // Monthly comparisons
        prisma.booking.count({ where: { status: 'COMPLETED', createdAt: { gte: monthStart } } }),
        prisma.booking.count({ 
          where: { 
            status: 'COMPLETED', 
            createdAt: { 
              gte: lastMonthStart, 
              lte: lastMonthEnd 
            } 
          } 
        }),
        
        // Payments
        prisma.booking.count({ where: { paymentStatus: 'PENDING' } }),
        
        // Tickets
        prisma.ticket.count({ where: { status: 'OPEN' } }),
        prisma.ticket.count({ where: { status: 'RESOLVED' } }),
        
        // Payment counts
        prisma.payment.count(),
        prisma.payment.count({ where: { status: 'PAID' } }),
        prisma.payment.count({ where: { status: 'FAILED' } }),
        
        // Recent signups (last 7 days)
        prisma.user.count({ 
          where: { 
            createdAt: { 
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
            } 
          } 
        }),
        
        // Provider stats
        prisma.provider.count({ where: { isVerified: true } }),
        prisma.provider.count({ where: { isFeatured: true } }),
        
        // Reviews
        prisma.review.count(),
        prisma.provider.aggregate({
          _avg: { rating: true }
        })
      ]);

      // Calculate growth metrics
      const bookingGrowth = completedLastMonth > 0 
        ? ((completedThisMonth - completedLastMonth) / completedLastMonth * 100).toFixed(1)
        : completedThisMonth > 0 ? 100 : 0;

      const summary = {
        // User metrics
        users: {
          total: totalUsers,
          customers: totalCustomers,
          providers: totalProviders,
          verifiedProviders,
          featuredProviders,
          recentSignups
        },
        
        // Booking metrics
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
        
        // Payment metrics
        payments: {
          total: totalPayments,
          paid: paidPayments,
          failed: failedPayments,
          pending: pendingPayments
        },
        
        // Support metrics
        tickets: {
          open: openTickets,
          resolved: resolvedTickets
        },
        
        // Service metrics
        services: {
          pendingApprovals
        },
        
        // Quality metrics
        quality: {
          totalReviews,
          averageRating: avgProviderRating?._avg?.rating?.toFixed(1) || 0
        }
      };

      const [escrow, disputedTickets] = await Promise.all([
        prisma.booking.aggregate({
          _sum: { amount: true },
          where: { paymentStatus: { in: ['PENDING', 'PAID'] } }
        }),
        prisma.ticket.count({
          where: { status: 'OPEN', subject: { contains: 'dispute', mode: 'insensitive' } }
        })
      ]);
      // No payout/commission model exists yet, so net payout is deliberately
      // reported as the gateway-settled gross amount rather than invented.
      summary.aggregates = {
        grossEscrowVolume: Number(escrow._sum.amount || 0),
        adminNetPayout: Number(escrow._sum.amount || 0),
        vettingBacklogCount: pendingApprovals,
        disputeTicketsCount: disputedTickets
      };

      sendApiSuccess(res, 200, summary);
    } catch (err) {
      console.error('[AdminDashboardController] Error:', err);
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to load dashboard metrics', err.message);
    }
  },

  // Additional analytics endpoint
  getAnalytics: async (req, res) => {
    try {
      const { period = '30d' } = req.query;
      
      let startDate = new Date();
      if (period === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (period === '90d') {
        startDate.setDate(startDate.getDate() - 90);
      } else {
        startDate.setDate(startDate.getDate() - 30);
      }

      // Get booking trends
      const bookingsByDay = await prisma.booking.groupBy({
        by: ['status'],
        _count: true,
        where: {
          createdAt: { gte: startDate }
        }
      });

      // Get top providers by completed bookings
      const topProviders = await prisma.booking.groupBy({
        by: ['providerId'],
        _count: true,
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        orderBy: {
          _count: {
            providerId: 'desc'
          }
        },
        take: 10
      });

      // Get top services by bookings
      const topServices = await prisma.booking.groupBy({
        by: ['serviceCategory'],
        _count: true,
        where: {
          createdAt: { gte: startDate }
        },
        orderBy: {
          _count: {
            serviceCategory: 'desc'
          }
        },
        take: 10
      });

      // Get rating distribution
      const ratings = await prisma.review.findMany({
        select: { rating: true },
        where: {
          createdAt: { gte: startDate }
        }
      });

      const ratingDistribution = {
        5: ratings.filter(r => r.rating === 5).length,
        4: ratings.filter(r => r.rating === 4).length,
        3: ratings.filter(r => r.rating === 3).length,
        2: ratings.filter(r => r.rating === 2).length,
        1: ratings.filter(r => r.rating === 1).length
      };

      sendApiSuccess(res, 200, {
        period,
        startDate,
        bookingsByStatus: bookingsByDay,
        topProviders,
        topServices,
        ratingDistribution,
        totalReviewsThisPeriod: ratings.length
      });
    } catch (err) {
      console.error('[AdminDashboardController] Analytics Error:', err);
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to load analytics', err.message);
    }
  }
};
