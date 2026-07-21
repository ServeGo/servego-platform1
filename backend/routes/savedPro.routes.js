import { Router } from 'express';
import { SavedProController } from '../controllers/savedProController.js';
import { requireAuth, requireRole } from '../utils/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('customer'), SavedProController.getMine);
router.post('/', requireAuth, requireRole('customer'), SavedProController.save);
router.delete('/:providerId', requireAuth, requireRole('customer'), SavedProController.unsave);

export default router;
