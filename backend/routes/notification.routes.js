import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../utils/auth.js';

const router = Router();

router.get('/', requireAuth, NotificationController.getAll);
router.get('/mine', requireAuth, NotificationController.getAll);
router.post('/', requireAuth, NotificationController.create);
router.patch('/read-all', requireAuth, NotificationController.readAll);
router.patch('/:id/read', requireAuth, NotificationController.read);
router.delete('/', requireAuth, NotificationController.clearAll);

export default router;
