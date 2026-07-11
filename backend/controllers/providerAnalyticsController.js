import prisma from '../prisma/client.js';

const toMonthKey = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const safeAvg = (nums) => {
  const arr = Array.isArray(nums) ? nums : [];
  if (!arr.length) return 0;
  const sum = arr.reduce((s, n) => s + (Number(n) || 0), 0);
  return sum / arr.length;
};

export const ProviderAnalyticsController = {
  getProviderAnalytics: async (req, res) => {
    try {
      const providerId = req.params.id;
      const { range = '90d' } = req.query || {};

      // Compute time window
      const now = new Date();
      let since;
      if (range === '7d') since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (range === '30d') since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else if (range === '90d') since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      else since = null;

      const whereBookings = {
        providerId,
      };
      if (since) {
        // Prefer bookingDate if present; fall back to createdAt.
        whereBookings.OR = [
          { bookingDate: { gte: since } },
          { createdAt: { gte: since } }
        ];
      }

      // Pull bookings (with minimal fields) + payments (for earnings)
      const [bookings, payments] = await Promise.all([
        prisma.booking.findMany({
          where: whereBookings,
          select: {
            id: true,
            customerId: true,
            status: true,
            paymentStatus: true,
            createdAt: true,
            updatedAt: true,
            bookingDate: true,
          },
        }),
        prisma.payment.findMany({
          where: {
            user: undefined,
            booking: {
              providerId,
              ...(since
                ? {
                    OR: [
                      { bookingDate: { gte: since } },
                      { createdAt: { gte: since } }
                    ]
                  }
                : {}),
            },
          },
          select: {
            status: true,
            paidAt: true,
            createdAt: true,
            bookingId: true,
            // NOTE: schema has no amount fields in Payment model.
            // We'll derive earnings using booking.paymentStatus only.
          },
        })
      ]);

      // Earnings: since Payment has no amount fields, approximate by PAID bookings count.
      const paidBookingIds = new Set(
        payments
          .filter((p) => p.status === 'PAID')
          .map((p) => p.bookingId)
      );

      const terminalStatuses = new Set(['COMPLETED', 'CANCELLED']);
      const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
      const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;

      const completionRate = (() => {
        const denom = completedCount + cancelledCount;
        if (!denom) return 0;
        return completedCount / denom;
      })();

      // Acceptance rate: treats CONFIRMED/ONGOING/COMPLETED as accepted vs all non-pending offers.
      const acceptedLike = new Set(['CONFIRMED', 'ONGOING', 'COMPLETED']);
      const offerCount = bookings.length;
      const acceptedCount = bookings.filter((b) => acceptedLike.has(b.status)).length;
      const acceptanceRate = offerCount ? acceptedCount / offerCount : 0;

      const cancellationRate = offerCount ? cancelledCount / offerCount : 0;

      // Average response time: time from booking createdAt to first status update away from PENDING.
      // With current schema, we only have booking-level fields; approximate using updatedAt.
      const pendingBookings = bookings.filter((b) => b.status !== 'PENDING');
      const responseTimesMs = pendingBookings
        .map((b) => {
          const c = b.createdAt ? new Date(b.createdAt).getTime() : NaN;
          const u = b.updatedAt ? new Date(b.updatedAt).getTime() : NaN;
          if (!Number.isFinite(c) || !Number.isFinite(u)) return null;
          const diff = u - c;
          return diff >= 0 ? diff : null;
        })
        .filter((x) => x !== null);

      const avgResponseTimeMs = safeAvg(responseTimesMs);

      // Retention & repeat customers: based on number of distinct bookings per customer.
      const byCustomer = new Map();
      for (const b of bookings) {
        const arr = byCustomer.get(b.customerId) || [];
        arr.push(b);
        byCustomer.set(b.customerId, arr);
      }
      const customerCount = byCustomer.size;
      const repeatCustomers = Array.from(byCustomer.values()).filter((arr) => arr.length >= 2).length;
      const retentionRate = customerCount ? repeatCustomers / customerCount : 0;

      // Booking trends by month (using bookingDate when available)
      const bookingTrendsByMonth = new Map();
      const revenueSeriesByMonth = new Map();

      for (const b of bookings) {
        const key = toMonthKey(b.bookingDate || b.createdAt);
        if (!key) continue;

        const existing = bookingTrendsByMonth.get(key) || {
          month: key,
          total: 0,
          completed: 0,
          cancelled: 0,
          pending: 0,
          confirmed: 0,
          ongoing: 0,
        };
        existing.total += 1;
        if (b.status === 'PENDING') existing.pending += 1;
        if (b.status === 'CONFIRMED') existing.confirmed += 1;
        if (b.status === 'ONGOING') existing.ongoing += 1;
        if (b.status === 'COMPLETED') existing.completed += 1;
        if (b.status === 'CANCELLED') existing.cancelled += 1;
        bookingTrendsByMonth.set(key, existing);

        // Revenue series approximation: count of PAID bookings.
        const revExisting = revenueSeriesByMonth.get(key) || { month: key, paidBookings: 0 };
        if (paidBookingIds.has(b.id) || b.paymentStatus === 'PAID') revExisting.paidBookings += 1;
        revenueSeriesByMonth.set(key, revExisting);
      }

      const bookingTrends = Array.from(bookingTrendsByMonth.values()).sort((a, b) => (a.month < b.month ? -1 : 1));
      const revenueSeries = Array.from(revenueSeriesByMonth.values()).sort((a, b) => (a.month < b.month ? -1 : 1));

      // Total earnings approximation: number of PAID bookings.
      const paidCount = paidBookingIds.size || bookings.filter((b) => b.paymentStatus === 'PAID').length;

      res.json({
        providerId,
        range,
        totals: {
          totalEarnings: paidCount,
          totalPaidBookings: paidCount,
          completionRate,
          acceptanceRate,
          cancellationRate,
          avgResponseTimeMs,
          retentionRate,
          repeatCustomers,
          customerCount,
        },
        monthlyEarnings: revenueSeries,
        bookingTrendsByMonth: bookingTrends,
        revenueSeriesByMonth: revenueSeries,
      });
    } catch (err) {
      res.status(500).json({
        error: 'Failed to load provider analytics',
        details: err.message,
      });
    }
  },
};

