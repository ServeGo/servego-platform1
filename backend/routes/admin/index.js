import { Router } from 'express';
import { requireAuth, requireRole } from '../../utils/auth.js';
import { AdminDashboardController } from '../../controllers/adminDashboardController.js';
import { AdminProviderServiceController } from '../../controllers/adminProviderServiceController.js';
import { AdminProviderServiceItemsController } from '../../controllers/adminProviderServiceItemsController.js';
import { AdminProviderStatusController } from '../../controllers/adminProviderStatusController.js';
import { BookingController } from '../../controllers/bookingController.js';
import { TicketController } from '../../controllers/ticketController.js';

const router = Router();

router.get('/dashboard', requireAuth, requireRole('admin'), AdminDashboardController.getSummary);
router.get('/dashboard-summary', requireAuth, requireRole('admin'), AdminDashboardController.getSummary);
router.get('/analytics', requireAuth, requireRole('admin'), AdminDashboardController.getAnalytics);

router.get('/provider-service-items', requireAuth, requireRole('admin'), AdminProviderServiceItemsController.getAll);
router.get('/provider-service-requests', requireAuth, requireRole('admin'), AdminProviderServiceController.getPendingRequests);
router.patch('/provider-service-requests/:id/approve', requireAuth, requireRole('admin'), AdminProviderServiceController.approveService);
router.patch('/provider-service-requests/:id/deny', requireAuth, requireRole('admin'), AdminProviderServiceController.denyService);
router.post('/providers/reputation/refresh', requireAuth, requireRole('admin'), AdminProviderServiceController.refreshReputation);

router.patch('/providers/:id/status', requireAuth, requireRole('admin'), AdminProviderStatusController.setStatus);

router.patch('/bookings/:id/status', requireAuth, requireRole('admin'), BookingController.updateStatus);

router.get('/tickets', requireAuth, requireRole('admin'), TicketController.getAll);
router.patch('/tickets/:id/resolve', requireAuth, requireRole('admin'), TicketController.resolve);

export default router;
