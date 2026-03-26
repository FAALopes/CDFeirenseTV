import { Router } from 'express';
import { WordPressController } from '../controllers/wordpress.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const controller = new WordPressController();

router.use(authenticate);

router.get('/posts', asyncHandler(controller.getPosts));
router.get('/categories', asyncHandler(controller.getCategories));

export default router;
