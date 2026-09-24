import type { PrismaClient } from '@prisma/client';
import { DEPARTAMENTOS, MUNICIPIOS } from './honduras';
import { ROLES } from './roles';

/**
 * Catálogos comunes a todas las instancias: departamentos, municipios, órdenes
 * religiosas, rangos sacerdotales y roles. Idempotente: se ejecuta en CADA
 * deploy (scripts/railway-start.mjs) para que las instancias ya inicializadas
 * reciban catálogos nuevos. No crea parroquia, usuarios ni personas.
 */
export async function sembrarCatalogos(prisma: PrismaClient): Promise<void> {
  // Catálogo territorial completo (nombres de municipios se respetan si ya existen).
  for (const [codigo, nombre] of DEPARTAMENTOS) {
    await prisma.departamento.upsert({
      where: { codigo_departamento: codigo },
      update: { nombre_departamento: nombre },
      create: { codigo_departamento: codigo, nombre_departamento: nombre },
    });
  }
  for (const [codigo, nombre] of MUNICIPIOS) {
    await prisma.municipio.upsert({
      where: { codigo_municipio: codigo },
      update: {},
      create: { codigo_municipio: codigo, codigo_departamento: codigo.slice(0, 2), nombre_municipio: nombre },
    });
  }
  console.log(`✓ Ubicación asegurada: ${DEPARTAMENTOS.length} departamentos, ${MUNICIPIOS.length} municipios`);

  for (const item of [
    { nombre: 'Diocesano', abreviatura: 'DIOC', rama: 'M' },
    { nombre: 'Salesiano', abreviatura: 'SDB', rama: 'M' },
  ]) {
    const existing = await prisma.ordenReligiosa.findFirst({
      where: { nombre: item.nombre },
      orderBy: { id_orden_religiosa: 'asc' },
    });
    const data = { ...item, descripcion: item.nombre };
    if (existing) {
      await prisma.ordenReligiosa.update({
        where: { id_orden_religiosa: existing.id_orden_religiosa },
        data,
      });
    } else {
      await prisma.ordenReligiosa.create({ data });
    }
  }
  console.log('✓ Órdenes religiosas aseguradas');

  for (const nombre of ['Diácono', 'Sacerdote', 'Obispo']) {
    const existing = await prisma.rangoOrdenSacerdotal.findFirst({
      where: { nombre },
      orderBy: { id_rango_sacerdotal: 'asc' },
    });
    const data = { nombre, descripcion: nombre };
    if (existing) {
      await prisma.rangoOrdenSacerdotal.update({
        where: { id_rango_sacerdotal: existing.id_rango_sacerdotal },
        data,
      });
    } else {
      await prisma.rangoOrdenSacerdotal.create({ data });
    }
  }
  console.log('✓ Rangos sacerdotales asegurados');

  // Roles del sistema: los nombres deben coincidir con src/lib/permissions.ts.
  for (const [nombre, descripcion] of ROLES) {
    const existente = await prisma.rolUsuario.findFirst({
      where: { nombre },
      orderBy: { id_rol: 'asc' },
    });
    const data = { nombre, descripcion, estado: 1, id_usuario_creacion: BigInt(0) };
    if (existente) {
      await prisma.rolUsuario.update({ where: { id_rol: existente.id_rol }, data })
    } else {
      await prisma.rolUsuario.create({ data });
    }
  }
  console.log(`✓ Roles asegurados: ${ROLES.map(([n]) => n).join(', ')}`);
}
