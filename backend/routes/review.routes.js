import { Router } from 'express';
import { ReviewController } from '../controllers/reviewController.js';
import { requireAuth, requireRole } from '../utils/auth.js';
import { reviewRateLimiter } from '../middleware/security.js';
import { validate, createReviewValidation } from '../middleware/validation.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), ReviewController.getAll);
router.post('/', requireAuth, reviewRateLimiter, validate(createReviewValidation), ReviewController.create);
router.delete('/:id', requireAuth, requireRole('admin'), ReviewController.deleteOne);

export default router;
