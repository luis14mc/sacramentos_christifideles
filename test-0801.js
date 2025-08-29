const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSectores0801() {
  try {
    const sectores = await prisma.sectorParroquial.findMany({
      where: { 
        parroquia: { 
          ubicacion: '0801' 
        } 
      }
    });
    
    console.log('Sectores para municipio 0801:', sectores.length);
    sectores.forEach(s => console.log('- ' + s.nombre));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSectores0801();
