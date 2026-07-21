import { Router } from 'express';
import { ProviderController } from '../controllers/providerController.js';
import { ProviderAvailabilityController } from '../controllers/providerAvailabilityController.js';
import { ProviderAnalyticsController } from '../controllers/providerAnalyticsController.js';
import { ProviderServiceDiscoveryController } from '../controllers/providerServiceDiscoveryController.js';
import { ProviderRepository } from '../repositories/provider.repository.js';
import { requireAuth, requireRole, optionalAuth } from '../utils/auth.js';
import { validate, registerProviderServiceValidation, updateProviderProfileValidation, updateAvailabilityValidation } from '../middleware/validation.js';

const router = Router();

router.get('/', optionalAuth, ProviderController.getAll);
router.get('/by-approved-service', ProviderServiceDiscoveryController.getApprovedProvidersByServiceName);

router.get('/me/availability', requireAuth, requireRole('provider'), async (req, res, next) => {
  try {
    const provider = await ProviderRepository.findByUserId(req.user.id, { id: true });
    if (!provider) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Provider profile not found.' });
    req.params.id = provider.id;
    return ProviderAvailabilityController.getAvailability(req, res, next);
  } catch (err) { next(err); }
});

router.get('/:id', optionalAuth, ProviderController.getById);
router.get('/:id/services', optionalAuth, ProviderController.getProviderServices);
router.get('/:id/availability', ProviderAvailabilityController.getAvailability);
router.get('/:id/analytics', requireAuth, requireRole(['provider', 'admin']), ProviderAnalyticsController.getProviderAnalytics);
router.get('/:id/reviews', (req, res, next) => import('../controllers/reviewController.js').then(m => m.ReviewController.getByProvider(req, res, next)));

router.put('/me/availability', requireAuth, requireRole('provider'), validate(updateAvailabilityValidation), async (req, res, next) => {
  try {
    const provider = await ProviderRepository.findByUserId(req.user.id, { id: true });
    if (!provider) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Provider profile not found.' });
    req.params.id = provider.id;
    return ProviderController.updateAvailability(req, res, next);
  } catch (err) { next(err); }
});

router.post('/:id/services/register', requireAuth, validate(registerProviderServiceValidation), ProviderController.registerProviderService);
router.patch('/:id/profile', requireAuth, validate(updateProviderProfileValidation), ProviderController.updateProfile);
router.patch('/:id/availability', requireAuth, validate(updateAvailabilityValidation), ProviderController.updateAvailability);
router.put('/:id/availability', requireAuth, validate(updateAvailabilityValidation), ProviderController.updateAvailability);
router.patch('/:id/verify', requireAuth, requireRole('admin'), ProviderController.verify);
router.patch('/:id/status', requireAuth, requireRole('admin'), (req, res, next) => import('../controllers/adminProviderStatusController.js').then(m => m.AdminProviderStatusController.setStatus(req, res, next)));

export default router;
