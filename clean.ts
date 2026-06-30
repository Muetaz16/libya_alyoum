import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  await prisma.breakingNews.deleteMany({});
  await prisma.news.deleteMany({
    where: {
      slug: {
        in: [
          'tripoli-political-developments-government-talks',
          'noc-plan-increase-production-two-million-barrels',
          'national-football-team-training-camp-tunisia',
          'opening-ceremony-international-cultural-festival-cyrene'
        ]
      }
    }
  });
  console.log('Dummy data deleted');
}

clean().catch(console.error).finally(() => prisma.$disconnect());
