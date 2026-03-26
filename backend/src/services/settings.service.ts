import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SettingsService {
  async getAll() {
    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  }

  async updateMany(data: Record<string, string>) {
    const operations = Object.entries(data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );

    await prisma.$transaction(operations);

    return this.getAll();
  }
}
