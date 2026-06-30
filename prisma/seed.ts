import { PrismaClient, Role, NewsStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password123!', salt);

  // 1. Create Users
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@libyaalyoum.ly' },
    update: {},
    create: {
      email: 'admin@libyaalyoum.ly',
      name: 'مدير النظام الرئيسي',
      passwordHash,
      role: Role.SUPER_ADMIN,
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: 'editor@libyaalyoum.ly' },
    update: {},
    create: {
      email: 'editor@libyaalyoum.ly',
      name: 'محرر الأخبار',
      passwordHash,
      role: Role.EDITOR,
    },
  });

  const journalist = await prisma.user.upsert({
    where: { email: 'journalist@libyaalyoum.ly' },
    update: {},
    create: {
      email: 'journalist@libyaalyoum.ly',
      name: 'صحفي ميداني',
      passwordHash,
      role: Role.JOURNALIST,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@libyaalyoum.ly' },
    update: {},
    create: {
      email: 'viewer@libyaalyoum.ly',
      name: 'مراقب عام',
      passwordHash,
      role: Role.VIEWER,
    },
  });

  console.log('Users created successfully.');

  // 2. Create Categories
  const categoriesData = [
    { nameAr: 'السياسة', nameEn: 'Politics', slug: 'politics', icon: 'Globe', color: 'red-600' },
    { nameAr: 'أخبار ليبيا', nameEn: 'Libya', slug: 'libya', icon: 'MapPin', color: 'green-600' },
    { nameAr: 'الاقتصاد', nameEn: 'Economy', slug: 'economy', icon: 'TrendingUp', color: 'amber-600' },
    { nameAr: 'الرياضة', nameEn: 'Sports', slug: 'sports', icon: 'Activity', color: 'blue-600' },
    { nameAr: 'التكنولوجيا', nameEn: 'Technology', slug: 'technology', icon: 'Cpu', color: 'indigo-600' },
    { nameAr: 'الصحة', nameEn: 'Health', slug: 'health', icon: 'Heart', color: 'emerald-600' },
    { nameAr: 'أخبار العالم', nameEn: 'World News', slug: 'world-news', icon: 'Navigation', color: 'purple-600' },
    { nameAr: 'الثقافة وفنون', nameEn: 'Culture', slug: 'culture', icon: 'BookOpen', color: 'pink-600' },
    { nameAr: 'فيديو', nameEn: 'Videos', slug: 'videos', icon: 'Video', color: 'slate-600' },
  ];

  const categoriesMap: { [slug: string]: string } = {};

  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { nameAr: cat.nameAr, nameEn: cat.nameEn, icon: cat.icon, color: cat.color },
      create: cat,
    });
    categoriesMap[cat.slug] = createdCat.id;
  }

  console.log('Categories created successfully.');

  // 3. Create Settings
  const settingsData = [
    { key: 'siteNameAr', value: 'ليبيا اليوم' },
    { key: 'siteNameEn', value: 'Libya Today' },
    { key: 'descriptionAr', value: 'بوابة إخبارية ليبية شاملة تقدم آخر الأخبار والتحليلات السياسية والاقتصادية والرياضية والمنوعات على مدار الساعة.' },
    { key: 'descriptionEn', value: 'A comprehensive Libyan news portal offering the latest news, political, economic, sports analysis around the clock.' },
    { key: 'socialFacebook', value: 'https://facebook.com/libyaalyoum' },
    { key: 'socialTwitter', value: 'https://twitter.com/libyaalyoum' },
    { key: 'contactEmail', value: 'contact@libyaalyoum.ly' },
    { key: 'contactPhone', value: '+218 91 123 4567' },
    { key: 'seoKeywords', value: 'أخبار ليبيا, طرابلس, بنغازي, الاقتصاد الليبي, ليبيا اليوم, news libya' },
  ];

  for (const set of settingsData) {
    await prisma.setting.upsert({
      where: { key: set.key },
      update: { value: set.value },
      create: set,
    });
  }

  console.log('Settings seeded successfully.');

  // 4. Create Breaking News
  await prisma.breakingNews.deleteMany({});
  await prisma.breakingNews.createMany({
    data: [],
  });

  console.log('Breaking news seeded.');

  // 5. Create Sample News Articles
  const sampleNews: any[] = [];

  for (const news of sampleNews) {
    await prisma.news.upsert({
      where: { slug: news.slug },
      update: {},
      create: news,
    });
  }

  console.log('Sample news articles seeded.');
  console.log('Seeding finished successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
