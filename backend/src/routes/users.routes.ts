import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const controller = new UsersController();

router.use(authenticate);

router.get('/', asyncHandler(controller.list));
router.post('/', requireAdmin, asyncHandler(controller.create));
router.put('/:id', requireAdmin, asyncHandler(controller.update));
router.patch('/:id/status', requireAdmin, asyncHandler(controller.toggleStatus));
router.delete('/:id', requireAdmin, asyncHandler(controller.delete));

export default router;
