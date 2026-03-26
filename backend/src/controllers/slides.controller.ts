import { Request, Response } from 'express';
import { SlidesService } from '../services/slides.service';

const slidesService = new SlidesService();

export class SlidesController {
  async list(req: Request, res: Response) {
    const { type, isActive, search, sortBy, sortOrder } = req.query;

    const slides = await slidesService.list({
      type: type as string,
      isActive: isActive as string,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    return res.json(slides);
  }

  async getById(req: Request, res: Response) {
    const id = parseInt(req.params.id as string, 10);

    try {
      const slide = await slidesService.getById(id);
      return res.json(slide);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async create(req: Request, res: Response) {
    const { type, title, content, duration, ordering, isActive, imageUrl } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'Tipo e título são obrigatórios' });
    }

    const slide = await slidesService.create({
      type,
      title,
      content: content || {},
      duration,
      ordering,
      isActive,
      imageUrl,
    });

    return res.status(201).json(slide);
  }

  async update(req: Request, res: Response) {
    const id = parseInt(req.params.id as string, 10);
    const { type, title, content, duration, ordering, isActive, imageUrl } = req.body;

    try {
      const slide = await slidesService.update(id, {
        type,
        title,
        content,
        duration,
        ordering,
        isActive,
        imageUrl,
      });
      return res.json(slide);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    const id = parseInt(req.params.id as string, 10);

    try {
      const result = await slidesService.delete(id);
      return res.json(result);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async reorder(req: Request, res: Response) {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items deve ser um array de {id, ordering}' });
    }

    const result = await slidesService.reorder(items);
    return res.json(result);
  }

  async toggleActive(req: Request, res: Response) {
    const id = parseInt(req.params.id as string, 10);

    try {
      const slide = await slidesService.toggleActive(id);
      return res.json(slide);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }
}
