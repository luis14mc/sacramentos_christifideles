const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkParroquias() {
  try {
    const parroquias = await prisma.parroquia.findMany({ take: 10 });
    console.log('Parroquias disponibles:');
    parroquias.forEach(p => {
      console.log(`- ID: ${p.id_parroquia} - Nombre: ${p.nombre}`);
    });
    
    const ordenes = await prisma.ordenReligiosa.findMany({ take: 5 });
    console.log('\nÓrdenes religiosas disponibles:');
    ordenes.forEach(o => {
      console.log(`- ID: ${o.id_orden_religiosa} - Nombre: ${o.nombre}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkParroquias();
