import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:placeholder@localhost:5432/cdfeirense_tv',
  jwtSecret: process.env.JWT_SECRET || 'cdf-feirense-tv-secret-key-2026',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  isProduction: process.env.NODE_ENV === 'production',
};
