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
import { cifrar, generarSecreto } from '../src/cifrado';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function main() {
  const [accion, codigo, nombre, url] = process.argv.slice(2);

  switch (accion) {
    case 'registrar': {
      if (!codigo || !SLUG.test(codigo) || !nombre || !url || !/^https?:\/\//.test(url)) {
        throw new Error('Uso: registrar <codigo-slug> "<nombre>" <https://url>');
      }
      const secreto = generarSecreto();
      await prisma.instancia.create({
        data: { codigo, nombre, url: url.replace(/\/+$/, ''), secreto_cifrado: cifrar(secreto) },
      });
      console.log(`Instancia ${codigo} registrada.\nINTEROP_SECRET=${secreto}\n(Guárdalo ahora: no se vuelve a mostrar.)`);
      break;
    }
    case 'rotar': {
      const secreto = generarSecreto();
      await prisma.instancia.update({ where: { codigo }, data: { secreto_cifrado: cifrar(secreto) } });
      console.log(`Nuevo INTEROP_SECRET para ${codigo}:\n${secreto}`);
      break;
    }
    case 'desactivar':
    case 'activar':
      await prisma.instancia.update({ where: { codigo }, data: { activa: accion === 'activar' } });
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
