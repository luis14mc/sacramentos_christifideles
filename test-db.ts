// Prueba de conexión y consulta básica a la base de datos
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔌 Probando conexión a la base de datos...');
  
  try {
    // Probar conexión básica
    await prisma.$connect();
    console.log('✅ Conexión exitosa a la base de datos');
    
    // Contar tablas principales
    console.log('\n📊 Verificando estructura de la base de datos:');
    
    // Estos queries funcionarán incluso con tablas vacías
    const departamentosCount = await prisma.departamento.count();
    const parroquiasCount = await prisma.parroquia.count();
    const usuariosCount = await prisma.usuario.count();
    const personasCount = await prisma.persona.count();
    const bautismosCount = await prisma.bautismo.count();
    
    console.log(`📍 Departamentos: ${departamentosCount}`);
    console.log(`⛪ Parroquias: ${parroquiasCount}`);
    console.log(`👥 Usuarios: ${usuariosCount}`);
    console.log(`👤 Personas: ${personasCount}`);
    console.log(`🛡️  Bautismos: ${bautismosCount}`);
    
    console.log('\n🎉 Base de datos ChristiFideles configurada correctamente');
    console.log('🚀 Lista para recibir datos de sacramentos');
    
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
