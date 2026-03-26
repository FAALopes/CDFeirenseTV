import { Request, Response } from 'express';
import { WordPressService } from '../services/wordpress.service';

const wordpressService = new WordPressService();

export class WordPressController {
  async getPosts(req: Request, res: Response) {
    const count = req.query.count ? parseInt(req.query.count as string, 10) : undefined;
    const posts = await wordpressService.getPosts(count);
    return res.json(posts);
  }

  async getCategories(_req: Request, res: Response) {
    const categories = await wordpressService.getCategories();
    return res.json(categories);
  }
}
