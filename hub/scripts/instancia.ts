/**
 * Administración de instancias del hub (se ejecuta en el servicio hub):
 *
 *   pnpm instancia registrar <codigo> "<nombre>" <url>   → imprime el secreto UNA vez
 *   pnpm instancia rotar <codigo>                        → nuevo secreto
 *   pnpm instancia desactivar <codigo>
 *   pnpm instancia activar <codigo>
 *   pnpm instancia listar
 *
 * El secreto impreso se configura como INTEROP_SECRET en la instancia parroquial.
 */
import { prisma } from '../src/prisma';
import { cambiarEstado, registrarParroquia, rotarSecreto } from '../src/parroquias';

async function main() {
  const [accion, codigo, nombre, url] = process.argv.slice(2);

  switch (accion) {
    case 'registrar': {
      if (!codigo || !nombre || !url) throw new Error('Uso: registrar <codigo-slug> "<nombre>" <https://url>');
      const secreto = await registrarParroquia(codigo, nombre, url);
      console.log(`Instancia ${codigo} registrada.\nINTEROP_SECRET=${secreto}\n(Guárdalo ahora: no se vuelve a mostrar.)`);
      break;
    }
    case 'rotar': {
      const secreto = await rotarSecreto(codigo);
      console.log(`Nuevo INTEROP_SECRET para ${codigo}:\n${secreto}`);
      break;
    }
    case 'desactivar':
    case 'activar':
      await cambiarEstado(codigo, accion === 'activar');
      console.log(`Instancia ${codigo} ${accion === 'activar' ? 'activada' : 'desactivada'}.`);
      break;
    case 'listar': {
      const filas = await prisma.instancia.findMany({
        select: { codigo: true, nombre: true, url: true, activa: true },
        orderBy: { codigo: 'asc' },
      });
      console.table(filas);
      break;
    }
    default:
      throw new Error('Acciones: registrar | rotar | desactivar | activar | listar');
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
