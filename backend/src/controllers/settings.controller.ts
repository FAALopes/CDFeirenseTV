import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';

const settingsService = new SettingsService();

export class SettingsController {
  async getAll(_req: Request, res: Response) {
    const settings = await settingsService.getAll();
    return res.json(settings);
  }

  async update(req: Request, res: Response) {
    const data = req.body;

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ error: 'Dados inválidos. Enviar objeto com pares chave-valor.' });
    }

    const settings = await settingsService.updateMany(data);
    return res.json(settings);
  }
}
