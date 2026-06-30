const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const latest = await prisma.news.findMany({ take: 2, orderBy: { createdAt: 'desc' } });
  console.log(JSON.stringify(latest, null, 2));
}

check().finally(() => prisma.$disconnect());
