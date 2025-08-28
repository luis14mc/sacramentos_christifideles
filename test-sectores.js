const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSectores() {
  try {
    console.log('🔍 Verificando sectores parroquiales...');
    
    // Contar total de sectores
    const totalSectores = await prisma.sectorParroquial.count();
    console.log(`📊 Total de sectores en DB: ${totalSectores}`);
    
    if (totalSectores > 0) {
      // Obtener algunos sectores de ejemplo
      const sectoresEjemplo = await prisma.sectorParroquial.findMany({
        take: 5,
        include: {
          parroquia: {
            include: {
              municipio: true
            }
          }
        }
      });
      
      console.log('🏛️ Sectores de ejemplo:');
      sectoresEjemplo.forEach(sector => {
        console.log(`  - ${sector.nombre} (ID: ${sector.id_sector_parroquial}) - Parroquia: ${sector.parroquia.nombre} - Municipio: ${sector.parroquia.municipio?.nombre_municipio || 'N/A'}`);
      });
      
      // Probar la consulta que usa la API
      console.log('\n🔍 Probando consulta con municipio 0826...');
      const sectoresMunicipio = await prisma.sectorParroquial.findMany({
        where: {
          parroquia: {
            ubicacion: '0826'
          }
        },
        include: {
          parroquia: true
        }
      });
      
      console.log(`📍 Sectores para municipio 0826: ${sectoresMunicipio.length}`);
      sectoresMunicipio.forEach(sector => {
        console.log(`  - ${sector.nombre} - Parroquia: ${sector.parroquia.nombre}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSectores();
