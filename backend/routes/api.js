import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { ProviderController } from '../controllers/providerController.js';
import { ProviderAvailabilityController } from '../controllers/providerAvailabilityController.js';

import { BookingController } from '../controllers/bookingController.js';
import { TicketController } from '../controllers/ticketController.js';
import { NotificationController } from '../controllers/notificationController.js';
import { ReviewController } from '../controllers/reviewController.js';
import { ServiceController } from '../controllers/serviceController.js';
import { PaymentController } from '../controllers/paymentController.js';
import { AdminProviderServiceController } from '../controllers/adminProviderServiceController.js';
import { AdminProviderServiceItemsController } from '../controllers/adminProviderServiceItemsController.js';
import { AdminDashboardController } from '../controllers/adminDashboardController.js';
import { ReferralsController } from '../controllers/referralsController.js';
import { ProviderServiceDiscoveryController } from '../controllers/providerServiceDiscoveryController.js';
import { ProviderAnalyticsController } from '../controllers/providerAnalyticsController.js';
import { requireAuth, requireRole } from '../utils/auth.js';
import { authRateLimiter, bookingRateLimiter, reviewRateLimiter } from '../middleware/security.js';
import { validate, registerValidation, loginValidation, createBookingValidation, createReviewValidation, createTicketValidation } from '../middleware/validation.js';

const apiRouter = Router();

// --- Authentication & Users ---
apiRouter.post('/auth/register', validate(registerValidation), UserController.register);
apiRouter.post('/auth/login', authRateLimiter, validate(loginValidation), UserController.login);
apiRouter.post('/auth/refresh', UserController.refreshToken);
apiRouter.get('/users', requireAuth, requireRole('admin'), UserController.getUsers);
apiRouter.patch('/users/:id/profile', requireAuth, UserController.updateProfile);

// --- Service Providers (Partners) ---
apiRouter.get('/providers', ProviderController.getAll);
apiRouter.get('/providers/by-approved-service', (req, res) => ProviderServiceDiscoveryController.getApprovedProvidersByServiceName(req, res));
apiRouter.get('/providers/:id', ProviderController.getById);
apiRouter.get('/providers/:id/services', ProviderController.getProviderServices);
apiRouter.get('/providers/:id/availability', ProviderAvailabilityController.getAvailabilityForDate);

apiRouter.post('/providers/:id/services/register', requireAuth, ProviderController.registerProviderService);
apiRouter.patch('/providers/:id/profile', requireAuth, ProviderController.updateProfile);
apiRouter.patch('/providers/:id/availability', requireAuth, ProviderController.updateAvailability);
apiRouter.patch('/providers/:id/verify', requireAuth, requireRole('admin'), ProviderController.verify);

// --- Bookings ---
apiRouter.get('/bookings', requireAuth, BookingController.getAll);
apiRouter.get('/bookings/:id', requireAuth, BookingController.getById);
apiRouter.post('/bookings', bookingRateLimiter, validate(createBookingValidation), BookingController.create);
apiRouter.patch('/bookings/:id/status', requireAuth, BookingController.updateStatus);
apiRouter.patch('/admin/bookings/:id/status', requireAuth, requireRole('admin'), BookingController.updateStatus);

apiRouter.post('/bookings/:id/messages', requireAuth, BookingController.addMessage);

// --- Notifications ---
apiRouter.get('/notifications', requireAuth, NotificationController.getAll);
apiRouter.post('/notifications', requireAuth, NotificationController.create);
apiRouter.patch('/notifications/:id/read', requireAuth, NotificationController.read);
apiRouter.delete('/notifications', requireAuth, NotificationController.clearAll);

// --- Support Tickets ---
apiRouter.get('/tickets', requireAuth, TicketController.getAll);
apiRouter.post('/tickets', validate(createTicketValidation), TicketController.create);
apiRouter.patch('/tickets/:id/resolve', requireAuth, requireRole('admin'), TicketController.resolve);
apiRouter.get('/admin/tickets', requireAuth, requireRole('admin'), TicketController.getAll);
apiRouter.patch('/admin/tickets/:id/resolve', requireAuth, requireRole('admin'), TicketController.resolve);

// --- Reviews ---
apiRouter.get('/reviews', requireAuth, requireRole('admin'), ReviewController.getAll);
apiRouter.post('/reviews', reviewRateLimiter, validate(createReviewValidation), ReviewController.create);

// --- Payments ---
apiRouter.get('/payments', requireAuth, PaymentController.getAll);
apiRouter.post('/payments', requireAuth, PaymentController.create);

// --- Referrals / Ambassador ---
apiRouter.post('/referrals/apply', requireAuth, (req, res) => ReferralsController.applyReferral(req, res));
apiRouter.get('/referrals/me', requireAuth, (req, res) => ReferralsController.getMeReferral(req, res));

// --- Services (Service Categories) ---
apiRouter.get('/services', ServiceController.getAll);
apiRouter.post('/services', requireAuth, requireRole('admin'), ServiceController.create);
apiRouter.delete('/services/:id', requireAuth, requireRole('admin'), ServiceController.deleteOne);
apiRouter.patch('/services/:id', requireAuth, requireRole('admin'), ServiceController.updateOne);
apiRouter.patch('/services/:id/hide', requireAuth, requireRole('admin'), ServiceController.hideOne);

// --- Provider Analytics ---
apiRouter.get('/providers/:id/analytics', requireAuth, requireRole('provider'), ProviderAnalyticsController.getProviderAnalytics);

// --- Admin: Dashboard ---
apiRouter.get('/admin/dashboard', requireAuth, requireRole('admin'), AdminDashboardController.getSummary);
apiRouter.get('/admin/analytics', requireAuth, requireRole('admin'), AdminDashboardController.getAnalytics);

// --- Admin: provider service items (pending requests + approved registrations) ---
apiRouter.get('/admin/provider-service-items', requireAuth, requireRole('admin'), (req, res) => AdminProviderServiceItemsController.getAll(req, res));

// Backward compatible: pending requests only
apiRouter.get('/admin/provider-service-requests', requireAuth, requireRole('admin'), (req, res) => AdminProviderServiceController.getPendingRequests(req, res));

apiRouter.patch('/admin/provider-service-requests/:id/approve', requireAuth, requireRole('admin'), (req, res) => AdminProviderServiceController.approveService(req, res));
apiRouter.patch('/admin/provider-service-requests/:id/deny', requireAuth, requireRole('admin'), (req, res) => AdminProviderServiceController.denyService(req, res));
apiRouter.post('/admin/providers/reputation/refresh', requireAuth, requireRole('admin'), (req, res) => AdminProviderServiceController.refreshReputation(req, res));

export default apiRouter;
