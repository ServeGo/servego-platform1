import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController.js';
import { ProviderServiceDiscoveryController } from '../controllers/providerServiceDiscoveryController.js';
import { requireAuth, requireRole } from '../utils/auth.js';
import { validate, createServiceValidation, updateServiceValidation } from '../middleware/validation.js';

const router = Router();

router.get('/search', ServiceController.search);
router.get('/', ServiceController.getAll);
router.get('/:slug/providers', ProviderServiceDiscoveryController.getApprovedProvidersByCategory);
router.get('/:slug', ServiceController.getCategoryBySlug);
router.get('/:id/active-count', ServiceController.getActiveCount);

router.post('/', requireAuth, requireRole('admin'), validate(createServiceValidation), ServiceController.create);
router.delete('/:id', requireAuth, requireRole('admin'), ServiceController.deleteOne);
router.patch('/:id', requireAuth, requireRole('admin'), validate(updateServiceValidation), ServiceController.updateOne);
router.patch('/:id/hide', requireAuth, requireRole('admin'), ServiceController.hideOne);

export default router;
