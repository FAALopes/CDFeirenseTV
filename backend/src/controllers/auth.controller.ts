import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }

    try {
      const result = await authService.login(username, password);
      return res.json(result);
    } catch (err: any) {
      return res.status(401).json({ error: err.message });
    }
  }

  async getMe(req: Request, res: Response) {
    try {
      const user = await authService.getMe(req.user!.id);
      return res.json(user);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async changePassword(req: Request, res: Response) {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password atual e nova password são obrigatórias' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Nova password deve ter pelo menos 4 caracteres' });
    }

    try {
      const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}
