import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WordPressService } from '../services/wordpress.service';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const prisma = new PrismaClient();
const wordpressService = new WordPressService();

// Allow all origins for public TV endpoints
router.use((_req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// GET /api/tv/slides - Active slides with WordPress news merged
router.get(
  '/slides',
  asyncHandler(async (_req: Request, res: Response) => {
    const slides = await prisma.slide.findMany({
      where: { isActive: true },
      orderBy: { ordering: 'asc' },
    });

    // Merge WordPress news data for news-type slides
    const enrichedSlides = await Promise.all(
      slides.map(async (slide) => {
        if (slide.type === 'news') {
          const content = slide.content as any;
          const count = content?.count || 5;
          try {
            const posts = await wordpressService.getPosts(count);
            return { ...slide, content: { ...content, posts } };
          } catch {
            return slide;
          }
        }
        return slide;
      })
    );

    return res.json(enrichedSlides);
  })
);

// GET /api/tv/settings - Public settings
router.get(
  '/settings',
  asyncHandler(async (_req: Request, res: Response) => {
    const publicKeys = [
      'defaultDuration',
      'transitionEffect',
      'transitionDuration',
      'tvRefreshInterval',
    ];

    const settings = await prisma.setting.findMany({
      where: { key: { in: publicKeys } },
    });

    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return res.json(result);
  })
);

export default router;
