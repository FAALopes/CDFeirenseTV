import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const passwordHash = await bcrypt.hash('admin', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Administrador',
      email: 'admin@cdfeirense.pt',
      passwordHash,
      role: 'admin',
      status: 'active',
    },
  });
  console.log(`Created admin user: ${admin.username}`);

  // Create default settings
  const defaultSettings = [
    { key: 'defaultDuration', value: '10' },
    { key: 'transitionEffect', value: 'fade' },
    { key: 'transitionDuration', value: '1000' },
    { key: 'wordpressApiUrl', value: 'https://cdfeirense.pt/wp-json/wp/v2' },
    { key: 'newsAutoFetchCount', value: '10' },
    { key: 'tvRefreshInterval', value: '30' },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log(`Created ${defaultSettings.length} default settings`);

  // Create sample slides
  const newsSlide = await prisma.slide.upsert({
    where: { id: 1 },
    update: {},
    create: {
      type: 'news',
      title: 'Notícias CDF',
      content: { autoFetch: true, count: 5 },
      duration: 10,
      ordering: 1,
      isActive: true,
    },
  });
  console.log(`Created slide: ${newsSlide.title}`);

  const announcementSlide = await prisma.slide.upsert({
    where: { id: 2 },
    update: {},
    create: {
      type: 'announcement',
      title: 'Bem-vindos ao Complexo Desportivo',
      content: {
        htmlContent:
          '<h1>Bem-vindos ao Complexo Desportivo Rodrigo Nunes</h1><p>Clube Desportivo Feirense</p>',
      },
      duration: 10,
      ordering: 2,
      isActive: true,
    },
  });
  console.log(`Created slide: ${announcementSlide.title}`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
