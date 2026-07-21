import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController.js';
import { requireAuth } from '../utils/auth.js';

const router = Router();

router.get('/', requireAuth, PaymentController.getAll);
router.post('/', requireAuth, PaymentController.create);
router.post('/initiate', requireAuth, PaymentController.create);
router.post('/webhook', PaymentController.webhook);

export default router;
