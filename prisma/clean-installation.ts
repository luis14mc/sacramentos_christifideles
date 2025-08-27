import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanInstallationData() {
  console.log('🧹 Limpiando datos de instalación para probar flujo inicial...');

  try {
    // Eliminar usuarios
    await prisma.usuario.deleteMany({});
    console.log('👤 Usuarios eliminados');

    // Eliminar configuración de parroquia
    await prisma.parroquiaConfig.deleteMany({});
    console.log('⚙️ Configuración de parroquia eliminada');

    // Eliminar parroquias
    await prisma.parroquia.deleteMany({});
    console.log('⛪ Parroquias eliminadas');

    console.log('✅ Limpieza completada. Sistema listo para instalación inicial.');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanInstallationData();
