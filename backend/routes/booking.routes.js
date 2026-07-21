import { Router } from 'express';
import { BookingController } from '../controllers/bookingController.js';
import { requireAuth, requireRole } from '../utils/auth.js';
import { bookingRateLimiter } from '../middleware/security.js';
import { validate, createBookingValidation } from '../middleware/validation.js';

const router = Router();

router.get('/', requireAuth, BookingController.getAll);
router.get('/mine', requireAuth, BookingController.getAll);
router.get('/:id/timeline', requireAuth, requireRole('admin'), BookingController.getTimeline);
router.get('/:id', requireAuth, BookingController.getById);
router.get('/:id/messages', requireAuth, BookingController.getMessages);

router.post('/', requireAuth, bookingRateLimiter, validate(createBookingValidation), BookingController.create);
router.post('/:id/messages', requireAuth, BookingController.addMessage);

router.patch('/:id/status', requireAuth, BookingController.updateStatus);
router.patch('/:id/accept', requireAuth, requireRole('provider'), BookingController.transition('CONFIRMED'));
router.patch('/:id/decline', requireAuth, requireRole('provider'), BookingController.transition('CANCELLED'));
router.patch('/:id/cancel', requireAuth, BookingController.transition('CANCELLED'));
router.patch('/:id/complete', requireAuth, requireRole('provider'), BookingController.transition('COMPLETED'));

export default router;
