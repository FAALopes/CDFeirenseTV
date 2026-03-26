import { Request, Response } from 'express';
import { UsersService } from '../services/users.service';

const usersService = new UsersService();

export class UsersController {
  async list(req: Request, res: Response) {
    const { role, status, search, sortBy, sortOrder } = req.query;

    const users = await usersService.list({
      role: role as string,
      status: status as string,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    return res.json(users);
  }

  async create(req: Request, res: Response) {
    const { username, name, email, password, role } = req.body;

    if (!username || !name || !password) {
      return res.status(400).json({ error: 'Username, nome e password são obrigatórios' });
    }

    try {
      const user = await usersService.create({ username, name, email, password, role });
      return res.status(201).json(user);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response) {
    const id = parseInt(req.params.id as string, 10);
    const { name, email, role, password } = req.body;

    try {
      const user = await usersService.update(id, { name, email, role, password });
      return res.json(user);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async toggleStatus(req: Request, res: Response) {
    const id = parseInt(req.params.id as string, 10);

    try {
      const user = await usersService.toggleStatus(id);
      return res.json(user);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response) {
    const id = parseInt(req.params.id as string, 10);

    try {
      const result = await usersService.softDelete(id);
      return res.json(result);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }
}
