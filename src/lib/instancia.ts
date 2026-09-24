import { prisma } from '@/lib/prisma';
import packageJson from '../../package.json';
import { leerCodigoInstancia } from '@/lib/instancia-env';

export { leerParroquiaDesdeEnv, leerCodigoInstancia } from '@/lib/instancia-env';

/**
 * Identidad de la instancia.
 *
 * Cada parroquia se despliega como una instancia independiente (propio
 * servicio Railway + propio PostgreSQL). El código es el mismo; la identidad
 * de la parroquia sale de variables de entorno. Ver docs/PLAN_MULTIPARROQUIA.md.
 */

export interface InstanciaInfo {
  codigo: string | null;
  nombre: string | null;
  version: string;
}

/** Información pública de la instancia. No incluye datos sensibles. */
export async function getInstanciaInfo(): Promise<InstanciaInfo> {
  const parroquia = await prisma.parroquia.findFirst({
    select: { nombre: true },
    orderBy: { id_parroquia: 'asc' },
  });
  return {
    codigo: leerCodigoInstancia(),
    nombre: parroquia?.nombre ?? null,
    version: packageJson.version,
  };
}
