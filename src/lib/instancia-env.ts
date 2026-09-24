/**
 * Lectura pura (sin Prisma) de la identidad de la instancia desde el entorno.
 * La usan el seed y `@/lib/instancia`. Ver docs/PLAN_MULTIPARROQUIA.md.
 */

export interface ParroquiaSeedData {
  nombre: string;
  ubicacion: string;
  direccion: string;
  telefono: string;
  email: string | null;
}

/** Valores por defecto: Cristo Resucitado (dev/CI no definen variables). */
const PARROQUIA_DEFAULT: ParroquiaSeedData = {
  nombre: 'Cristo Resucitado de Loarque',
  ubicacion: '0801',
  direccion: 'Loarque, Distrito Central, Francisco Morazán',
  telefono: '+504 0000-0000',
  email: 'admin@cristoresucitado.org',
};

function limpiar(valor: string | undefined): string | undefined {
  const v = valor?.trim();
  return v ? v : undefined;
}

/**
 * Lee los datos de la parroquia de la instancia desde el entorno.
 * Si `PARROQUIA_NOMBRE` no está definida se usan los valores por defecto
 * completos, para no mezclar datos de dos parroquias.
 */
export function leerParroquiaDesdeEnv(
  env: Record<string, string | undefined> = process.env
): ParroquiaSeedData {
  const nombre = limpiar(env.PARROQUIA_NOMBRE);
  if (!nombre) return { ...PARROQUIA_DEFAULT };

  const ubicacion = limpiar(env.PARROQUIA_UBICACION) ?? '0801';
  if (!/^\d{4}$/.test(ubicacion)) {
    throw new Error('PARROQUIA_UBICACION debe ser un código de municipio de 4 dígitos.');
  }

  return {
    nombre,
    ubicacion,
    direccion: limpiar(env.PARROQUIA_DIRECCION) ?? '',
    telefono: limpiar(env.PARROQUIA_TELEFONO) ?? '',
    email: limpiar(env.PARROQUIA_EMAIL) ?? null,
  };
}

/** Slug estable de la instancia (p. ej. `cristo-resucitado`), usado por interoperabilidad. */
export function leerCodigoInstancia(
  env: Record<string, string | undefined> = process.env
): string | null {
  const codigo = limpiar(env.PARROQUIA_CODIGO);
  if (!codigo) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(codigo)) {
    throw new Error('PARROQUIA_CODIGO debe ser un slug en minúsculas (a-z, 0-9, guiones).');
  }
  return codigo;
}
