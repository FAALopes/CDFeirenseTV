import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err.message);

  if (!config.isProduction) {
    console.error(err.stack);
  }

  res.status(500).json({
    error: config.isProduction ? 'Erro interno do servidor' : err.message,
  });
};
