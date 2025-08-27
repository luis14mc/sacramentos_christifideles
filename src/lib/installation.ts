import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkInstallationStatus() {
  try {
    // Verificar si existe al menos una parroquia configurada
    const parroquiaCount = await prisma.parroquia.count();
    
    // Verificar si existe al menos un usuario administrador
    const adminCount = await prisma.usuario.count({
      where: {
        rol: {
          nombre: 'Super Admin'
        }
      }
    });
    
    return {
      isInstalled: parroquiaCount > 0 && adminCount > 0,
      parroquiaCount,
      adminCount
    };
  } catch (error) {
    console.error('Error checking installation status:', error);
    return {
      isInstalled: false,
      parroquiaCount: 0,
      adminCount: 0
    };
  }
}

export async function getFirstParroquia() {
  try {
    const parroquia = await prisma.parroquia.findFirst({
      include: {
        config: true
      }
    });
    
    return parroquia;
  } catch (error) {
    console.error('Error getting first parroquia:', error);
    return null;
  }
}
