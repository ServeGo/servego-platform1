import prisma from '../prisma/client.js';
import { sendApiError, sendApiSuccess } from '../utils/response.js';

export const AdminDashboardController = {
  getSummary: async (req, res) => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        totalProviders,
        totalCustomers,
        activeBookings,
        pendingApprovals,
        completedThisMonth,
        pendingPayments,
        openTickets,
        totalRevenue
      ] = await Promise.all([
        prisma.provider.count(),
        prisma.user.count({ where: { role: 'customer' } }),
        prisma.booking.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'ONGOING'] } } }),
        prisma.providerServiceRequest.count({ where: { status: 'PENDING' } }),
        prisma.booking.count({ where: { status: 'COMPLETED', createdAt: { gte: monthStart } } }),
        prisma.booking.count({ where: { paymentStatus: 'PENDING' } }),
        prisma.ticket.count({ where: { status: 'OPEN' } }),
        prisma.payment.count({ where: { status: 'PAID' } })
      ]);

      sendApiSuccess(res, 200, {
        totalProviders,
        totalCustomers,
        activeBookings,
        pendingApprovals,
        completedThisMonth,
        pendingPayments,
        openTickets,
        paidPaymentsCount: totalRevenue
      });
    } catch (err) {
      sendApiError(res, 500, 'INTERNAL_ERROR', 'Failed to load dashboard metrics', err.message);
    }
  }
};
