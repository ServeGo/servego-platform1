import { Router } from 'express';
import { TicketController } from '../controllers/ticketController.js';
import { requireAuth, requireRole, optionalAuth } from '../utils/auth.js';
import { supportTicketRateLimiter } from '../middleware/security.js';
import { validate, createTicketValidation, createAuthenticatedTicketValidation } from '../middleware/validation.js';

const router = Router();

router.get('/', requireAuth, TicketController.getAll);
router.post('/', requireAuth, validate(createAuthenticatedTicketValidation), TicketController.create);
router.patch('/:id/resolve', requireAuth, requireRole('admin'), TicketController.resolve);
router.patch('/:id/status', requireAuth, requireRole('admin'), TicketController.setStatus);

// Backward-compatible aliases
router.get('/mine', requireAuth, TicketController.getAll);

export default router;
