import { PrismaClient } from '@prisma/client';
import { seedRolePagePermissions } from './seed-permissions';

const prisma = new PrismaClient();

seedRolePagePermissions(prisma)
  .then(async () => {
    await prisma.$disconnect();
    console.log('Permisos rol-página actualizados.');
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
