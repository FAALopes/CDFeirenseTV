import { Router } from 'express';
import { SlidesController } from '../controllers/slides.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const controller = new SlidesController();

router.use(authenticate);

router.get('/', asyncHandler(controller.list));
router.get('/:id', asyncHandler(controller.getById));
router.post('/', asyncHandler(controller.create));
router.put('/reorder', asyncHandler(controller.reorder));
router.put('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.delete));
router.patch('/:id/toggle', asyncHandler(controller.toggleActive));

export default router;
