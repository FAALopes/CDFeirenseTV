import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

export class UploadsController {
  async upload(req: Request, res: Response) {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
    }

    const filename = req.file.filename;
    const url = `/uploads/${filename}`;

    return res.status(201).json({ filename, url });
  }

  async delete(req: Request, res: Response) {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ error: 'Nome do ficheiro é obrigatório' });
    }

    // Prevent directory traversal
    const safeName = path.basename(filename as string);
    const filePath = path.join(config.uploadDir, safeName);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.json({ message: 'Ficheiro eliminado com sucesso', filename: safeName });
      } else {
        return res.status(404).json({ error: 'Ficheiro não encontrado' });
      }
    } catch (err: any) {
      return res.status(500).json({ error: 'Erro ao eliminar ficheiro' });
    }
  }
}
