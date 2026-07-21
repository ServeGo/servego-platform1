import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../utils/auth.js';
import { validate, updateUserProfileValidation } from '../middleware/validation.js';

const router = Router();

router.get('/', requireAuth, requireRole('admin'), UserController.getUsers);
router.patch('/:id/profile', requireAuth, validate(updateUserProfileValidation), UserController.updateProfile);

export default router;
