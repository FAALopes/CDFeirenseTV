import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const controller = new AuthController();

router.post('/login', asyncHandler(controller.login));
router.get('/me', authenticate, asyncHandler(controller.getMe));
router.post('/change-password', authenticate, asyncHandler(controller.changePassword));

export default router;
