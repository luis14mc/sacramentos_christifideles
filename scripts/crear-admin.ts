/**
 * Super Admin de ESTA instancia parroquial, sin tocar nada más.
 *
 * Modo deploy (scripts/railway-start.mjs, en cada arranque):
 *   pnpm admin:general
 *   Asegura el admin general `admin@christifideles.org` (o ADMIN_GENERAL_EMAIL)
 *   con la contraseña de ADMIN_GENERAL_PASSWORD. Solo lo CREA si no existe: si ya
 *   existe no se modifica, para que su contraseña se pueda cambiar desde el sistema.
 *   Sin ADMIN_GENERAL_PASSWORD se omite.
 *
 * Modo manual (emergencias, p. ej. contraseña olvidada):
 *   ADMIN_EMAIL=... ADMIN_PASSWORD='...' pnpm admin:crear
 *   Crea o actualiza: asigna Super Admin, activa y REEMPLAZA la contraseña.
 *
 * Cada instancia tiene su propia BD: el admin general es una cuenta por
 * parroquia con el mismo email.
 */
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 10;
export const EMAIL_ADMIN_GENERAL = 'admin@christifideles.org';

const modoGeneral = process.argv.includes('--general');

const prisma = new PrismaClient();

async function main() {
  const email = (
    modoGeneral ? process.env.ADMIN_GENERAL_EMAIL?.trim() || EMAIL_ADMIN_GENERAL : process.env.ADMIN_EMAIL?.trim()
  )?.toLowerCase();
  const password = modoGeneral ? process.env.ADMIN_GENERAL_PASSWORD : process.env.ADMIN_PASSWORD;
  const nombre = process.env.ADMIN_NOMBRE?.trim() || 'Administrador general';

  if (modoGeneral && !password) {
    console.log('Admin general omitido: falta ADMIN_GENERAL_PASSWORD.');
    return;
  }

  if (!email || !EMAIL_RE.test(email)) throw new Error('ADMIN_EMAIL es obligatorio y debe ser un email válido.');
  if (!password || password.length < MIN_PASSWORD) {
    throw new Error(`ADMIN_PASSWORD es obligatoria y debe tener al menos ${MIN_PASSWORD} caracteres.`);
  }

  const parroquia = await prisma.parroquia.findFirst({ orderBy: { id_parroquia: 'asc' } });
  if (!parroquia) throw new Error('Esta instancia aún no tiene parroquia: despliega primero (seed inicial).');

  const rol = await prisma.rolUsuario.findFirst({ where: { nombre: 'Super Admin' }, orderBy: { id_rol: 'asc' } });
  if (!rol) throw new Error('No existe el rol Super Admin: ejecuta `pnpm db:seed:catalogos`.');

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente && modoGeneral) {
    console.log(`Admin general ya existe: ${email} (sin cambios)`);
    return;
  }
  const contrasena = Buffer.from(await hash(password, 12));
  if (existente) {
    await prisma.usuario.update({
      where: { email },
      data: { id_rol: rol.id_rol, contrasena, estado: 1, id_parroquia: parroquia.id_parroquia },
    });
    console.log(`✓ Super Admin actualizado: ${email} (${parroquia.nombre})`);
  } else {
    await prisma.usuario.create({
      data: {
        email,
        nombre,
        id_parroquia: parroquia.id_parroquia,
        id_rol: rol.id_rol,
        contrasena,
        estado: 1,
        id_usuario_creacion: BigInt(0),
      },
    });
    console.log(`✓ Super Admin creado: ${email} (${parroquia.nombre})`);
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
