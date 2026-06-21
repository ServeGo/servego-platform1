import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { ProviderController } from '../controllers/providerController.js';
import { BookingController } from '../controllers/bookingController.js';
import { TicketController } from '../controllers/ticketController.js';
import { NotificationController } from '../controllers/notificationController.js';
import { ReviewController } from '../controllers/reviewController.js';
import { ServiceController } from '../controllers/serviceController.js';
import { PaymentController } from '../controllers/paymentController.js';
import { AdminProviderServiceController } from '../controllers/adminProviderServiceController.js';
import { AdminProviderServiceItemsController } from '../controllers/adminProviderServiceItemsController.js';
import { ReferralsController } from '../controllers/referralsController.js';
import { ProviderServiceDiscoveryController } from '../controllers/providerServiceDiscoveryController.js';
















const apiRouter = Router();



// --- Authentication & Users ---


apiRouter.post('/auth/register', UserController.register);
apiRouter.post('/auth/login', UserController.login);
apiRouter.get('/users', UserController.getUsers);

// --- Service Providers (Partners) ---
apiRouter.get('/providers', ProviderController.getAll);
apiRouter.get('/providers/:id', ProviderController.getById);
apiRouter.get('/providers/:id/services', ProviderController.getProviderServices);
apiRouter.post('/providers/:id/services/register', ProviderController.registerProviderService);
apiRouter.patch('/providers/:id/profile', ProviderController.updateProfile);
apiRouter.patch('/providers/:id/availability', ProviderController.updateAvailability);
apiRouter.patch('/providers/:id/verify', ProviderController.verify);

// --- Bookings ---
apiRouter.get('/bookings', BookingController.getAll);
apiRouter.get('/bookings/:id', BookingController.getById);
apiRouter.post('/bookings', BookingController.create);
apiRouter.patch('/bookings/:id/status', BookingController.updateStatus);
apiRouter.post('/bookings/:id/messages', BookingController.addMessage);

// --- Notifications ---
apiRouter.get('/notifications', NotificationController.getAll);
apiRouter.post('/notifications', NotificationController.create);
apiRouter.patch('/notifications/:id/read', NotificationController.read);
apiRouter.delete('/notifications', NotificationController.clearAll);

// --- Support Tickets ---
apiRouter.get('/tickets', TicketController.getAll);
apiRouter.post('/tickets', TicketController.create);
apiRouter.patch('/tickets/:id/resolve', TicketController.resolve);

// --- Reviews ---
apiRouter.post('/reviews', ReviewController.create);

// --- Payments ---
apiRouter.get('/payments', PaymentController.getAll);
apiRouter.post('/payments', PaymentController.create);

// --- Referrals / Ambassador ---
apiRouter.post('/referrals/apply', (req, res) => ReferralsController.applyReferral(req, res));
apiRouter.get('/referrals/me', (req, res) => ReferralsController.getMeReferral(req, res));

// --- Services (Service Categories) ---
apiRouter.get('/services', ServiceController.getAll);
apiRouter.post('/services', ServiceController.create);
apiRouter.delete('/services/:id', ServiceController.deleteOne);
apiRouter.patch('/services/:id', ServiceController.updateOne);
apiRouter.patch('/services/:id/hide', ServiceController.hideOne);


// --- Admin: provider service items (pending requests + approved registrations) ---
apiRouter.get('/admin/provider-service-items', (req, res) => AdminProviderServiceItemsController.getAll(req, res));



// Backward compatible: pending requests only
apiRouter.get('/admin/provider-service-requests', (req, res) => AdminProviderServiceController.getPendingRequests(req, res));


apiRouter.patch('/admin/provider-service-requests/:id/approve', (req, res) => AdminProviderServiceController.approveService(req, res));
apiRouter.patch('/admin/provider-service-requests/:id/deny', (req, res) => AdminProviderServiceController.denyService(req, res));
apiRouter.post('/admin/providers/reputation/refresh', (req, res) => AdminProviderServiceController.refreshReputation(req, res));

// --- Customer: approved providers by service name (sector listing) ---
apiRouter.get('/providers/by-approved-service', (req, res) => ProviderServiceDiscoveryController.getApprovedProvidersByServiceName(req, res));

export default apiRouter;






