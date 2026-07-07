import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function checkInstallationStatus() {
  try {
    const parroquiaCount = await prisma.parroquia.count();
    const adminCount = await prisma.usuario.count({
      where: { rol: { nombre: 'Super Admin' } },
    });

    return {
      isInstalled: parroquiaCount > 0 && adminCount > 0,
      parroquiaCount,
      adminCount,
    };
  } catch (error) {
    logger.error('Error checking installation status:', error);
    return {
      isInstalled: false,
      parroquiaCount: 0,
      adminCount: 0,
    };
  }
}

export async function getFirstParroquia() {
  try {
    return await prisma.parroquia.findFirst({ include: { config: true } });
  } catch (error) {
    logger.error('Error getting first parroquia:', error);
    return null;
  }
}
