const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
  const username = 'metamanageradmin';
  const password = 'securepassword123'; // Replace with a strong password

  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({ where: { username } });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'admin',
      },
    });
  }
}

createAdminUser()
  .then(() => console.log('Admin user created'))
  .catch((error) => console.error('Failed to create admin user', error))
  .finally(() => prisma.$disconnect());
