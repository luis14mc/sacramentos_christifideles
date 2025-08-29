const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findDistritoCentral() {
  try {
    const municipios = await prisma.municipio.findMany({ 
      where: { 
        nombre_municipio: { 
          contains: 'Distrito Central' 
        } 
      } 
    });
    
    console.log('Municipios que contienen "Distrito Central":');
    municipios.forEach(m => {
      console.log(`- ${m.nombre_municipio} (${m.codigo_municipio})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findDistritoCentral();
