import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import providerRoutes from './provider.routes.js';
import bookingRoutes from './booking.routes.js';
import notificationRoutes from './notification.routes.js';
import ticketRoutes from './ticket.routes.js';
import reviewRoutes from './review.routes.js';
import paymentRoutes from './payment.routes.js';
import referralRoutes from './referral.routes.js';
import serviceRoutes from './service.routes.js';
import savedProRoutes from './savedPro.routes.js';
import adminRoutes from './admin/index.js';
import { ProviderServiceDiscoveryController } from '../controllers/providerServiceDiscoveryController.js';
import { requireAuth, requireRole, optionalAuth } from '../utils/auth.js';
import { supportTicketRateLimiter } from '../middleware/security.js';
import { validate, createTicketValidation } from '../middleware/validation.js';
import { TicketController } from '../controllers/ticketController.js';
import { AdminProviderServiceController } from '../controllers/adminProviderServiceController.js';

const apiRouter = Router();

// Mount domain routers
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/providers', providerRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/tickets', ticketRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/referrals', referralRoutes);
apiRouter.use('/services', serviceRoutes);
apiRouter.use('/saved-pros', savedProRoutes);
apiRouter.use('/admin', adminRoutes);

// Category aliases — /categories maps to /services
apiRouter.get('/categories', (req, res, next) => import('../controllers/serviceController.js').then(m => m.ServiceController.getAll(req, res, next)));
apiRouter.get('/categories/:slug', (req, res, next) => import('../controllers/serviceController.js').then(m => m.ServiceController.getCategoryBySlug(req, res, next)));
apiRouter.get('/categories/:slug/providers', (req, res, next) => import('../controllers/providerServiceDiscoveryController.js').then(m => m.ProviderServiceDiscoveryController.getApprovedProvidersByCategory(req, res, next)));
apiRouter.get('/categories/:id/active-count', (req, res, next) => import('../controllers/serviceController.js').then(m => m.ServiceController.getActiveCount(req, res, next)));
apiRouter.post('/categories', requireAuth, requireRole('admin'), (req, res, next) => import('../middleware/validation.js').then(({ validate, createServiceValidation }) => validate(createServiceValidation)(req, res, () => import('../controllers/serviceController.js').then(m => m.ServiceController.create(req, res, next)))));
apiRouter.delete('/categories/:id', requireAuth, requireRole('admin'), (req, res, next) => import('../controllers/serviceController.js').then(m => m.ServiceController.deleteOne(req, res, next)));
apiRouter.patch('/categories/:id', requireAuth, requireRole('admin'), (req, res, next) => import('../middleware/validation.js').then(({ validate, updateServiceValidation }) => validate(updateServiceValidation)(req, res, () => import('../controllers/serviceController.js').then(m => m.ServiceController.updateOne(req, res, next)))));

// Backward-compatible provider-service aliases
apiRouter.post('/provider-services', requireAuth, requireRole('provider'), (req, res, next) => import('../controllers/providerController.js').then(m => m.ProviderController.registerOwnProviderService(req, res, next)));
apiRouter.get('/provider-services/mine', requireAuth, requireRole('provider'), (req, res, next) => import('../controllers/providerController.js').then(m => m.ProviderController.getMyProviderServices(req, res, next)));
apiRouter.get('/provider-services', requireAuth, requireRole('admin'), (req, res, next) => import('../controllers/adminProviderServiceController.js').then(m => m.AdminProviderServiceController.getPendingRequests(req, res, next)));
apiRouter.patch('/provider-services/:id/approve', requireAuth, requireRole('admin'), (req, res, next) => import('../controllers/adminProviderServiceController.js').then(m => m.AdminProviderServiceController.approveService(req, res, next)));
apiRouter.patch('/provider-services/:id/reject', requireAuth, requireRole('admin'), (req, res, next) => import('../controllers/adminProviderServiceController.js').then(m => m.AdminProviderServiceController.denyService(req, res, next)));

// Backward-compatible support-ticket aliases
apiRouter.get('/support-tickets/mine', requireAuth, TicketController.getAll);
apiRouter.get('/support-tickets', requireAuth, requireRole('admin'), TicketController.getAll);
apiRouter.post('/support-tickets', supportTicketRateLimiter, optionalAuth, validate(createTicketValidation), TicketController.create);
apiRouter.patch('/support-tickets/:id/status', requireAuth, requireRole('admin'), TicketController.setStatus);

// Backward-compatible admin ticket aliases
apiRouter.get('/admin/tickets', requireAuth, requireRole('admin'), TicketController.getAll);
apiRouter.patch('/admin/tickets/:id/resolve', requireAuth, requireRole('admin'), TicketController.resolve);

// Discovery alias
apiRouter.get('/providers/by-approved-service', ProviderServiceDiscoveryController.getApprovedProvidersByServiceName);

// Admin provider service requests (backward compat)
apiRouter.get('/admin/provider-service-requests', requireAuth, requireRole('admin'), (req, res, next) => import('../controllers/adminProviderServiceController.js').then(m => m.AdminProviderServiceController.getPendingRequests(req, res, next)));
apiRouter.patch('/admin/provider-service-requests/:id/approve', requireAuth, requireRole('admin'), (req, res, next) => import('../controllers/adminProviderServiceController.js').then(m => m.AdminProviderServiceController.approveService(req, res, next)));
apiRouter.patch('/admin/provider-service-requests/:id/deny', requireAuth, requireRole('admin'), (req, res, next) => import('../controllers/adminProviderServiceController.js').then(m => m.AdminProviderServiceController.denyService(req, res, next)));

export default apiRouter;
