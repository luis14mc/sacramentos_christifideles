import type { Prisma } from '@prisma/client';

/**
 * El tipo de sector no se pide al usuario: el nombre del sector ya lo
 * describe ("Sede parroquial", "Capilla San José"…). Internamente se asigna el
 * tipo "General", creándolo si no existe (la columna es NOT NULL en SQL v3).
 */
export async function idTipoSectorGeneral(tx: Prisma.TransactionClient): Promise<number> {
  const existente = await tx.tipoSectorParroquial.findFirst({
    where: { nombre: 'General' },
    orderBy: { id_tipo_sector_parroquial: 'asc' },
    select: { id_tipo_sector_parroquial: true },
  });
  if (existente) return existente.id_tipo_sector_parroquial;
  const creado = await tx.tipoSectorParroquial.create({
    data: { nombre: 'General', descripcion: 'Sector parroquial general' },
    select: { id_tipo_sector_parroquial: true },
  });
  return creado.id_tipo_sector_parroquial;
}
