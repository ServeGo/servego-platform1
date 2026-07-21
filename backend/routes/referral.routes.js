import { Router } from 'express';
import { ReferralsController } from '../controllers/referralsController.js';
import { requireAuth } from '../utils/auth.js';

const router = Router();

router.post('/apply', requireAuth, ReferralsController.applyReferral);
router.get('/me', requireAuth, ReferralsController.getMeReferral);
router.post('/generate', requireAuth, ReferralsController.generate);
router.post('/claim', requireAuth, ReferralsController.applyReferral);

export default router;
