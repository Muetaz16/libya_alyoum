const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('motaz123', 10);
  
  await prisma.user.upsert({
    where: { email: 'motaz@gmail.com' },
    update: { passwordHash: hash, role: 'SUPER_ADMIN' },
    create: {
      email: 'motaz@gmail.com',
      name: 'Motaz',
      passwordHash: hash,
      role: 'SUPER_ADMIN'
    }
  });

  console.log('User created!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
