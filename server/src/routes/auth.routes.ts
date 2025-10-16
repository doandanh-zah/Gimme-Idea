import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateBody } from '../middleware/validation.js';
import { registerSchema, loginSchema } from '../validators/auth.schemas.js';
import { loginHandler, registerHandler, refreshHandler, logoutHandler, verifyEmailHandler, forgotPasswordHandler, resetPasswordHandler } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), registerHandler);
router.get('/verify-email', verifyEmailHandler);
router.post('/login', authLimiter, validateBody(loginSchema), loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);
router.post('/forgot-password', authLimiter, forgotPasswordHandler);
router.post('/reset-password', authLimiter, resetPasswordHandler);

export default router;

