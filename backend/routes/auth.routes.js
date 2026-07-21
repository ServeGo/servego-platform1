import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { requireAuth, requireRole } from '../utils/auth.js';
import { authRateLimiter } from '../middleware/security.js';
import { validate, registerValidation, loginValidation, updateUserProfileValidation, forgotPasswordValidation, resetPasswordValidation } from '../middleware/validation.js';

const router = Router();

router.post('/register', validate(registerValidation), UserController.register);
router.post('/signup', validate(registerValidation), UserController.register);
router.post('/login', authRateLimiter, validate(loginValidation), UserController.login);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordValidation), UserController.forgotPassword);
router.post('/reset-password', authRateLimiter, validate(resetPasswordValidation), UserController.resetPassword);
router.post('/refresh', UserController.refreshToken);
router.get('/me', requireAuth, UserController.getMe);

export default router;
