import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const controller = new SettingsController();

router.use(authenticate);

router.get('/', asyncHandler(controller.getAll));
router.put('/', requireAdmin, asyncHandler(controller.update));

export default router;
