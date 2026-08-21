import { prisma } from '@/lib/prisma';

// Sacramentos con "libro" en v1 (allowlist; sin defunción).
export const SACRAMENTOS_LIBRO = ['bautismo', 'primera_comunion', 'confirmacion', 'matrimonio'] as const;
export type SacramentoLibro = (typeof SACRAMENTOS_LIBRO)[number];

export function esSacramentoValido(s: string): s is SacramentoLibro {
  return (SACRAMENTOS_LIBRO as readonly string[]).includes(s);
}

export interface PersonaLite {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
}

// Registro normalizado para que la UI de Libros no dependa de 4 modelos.
export interface LibroRegistro {
  id: string;
  sacramento: SacramentoLibro;
  personaPrincipal: PersonaLite | null;
  personaSecundaria: PersonaLite | null;
  fecha: string | null;
  numero_libro: string;
  numero_pagina: string | null;
  numero_registro: string;
}

export interface LibroFiltros {
  libro?: string;
  pagina?: string;
  registro?: string;
  dni?: string;
  nombre?: string;
}

export interface LibroResultado {
  data: LibroRegistro[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const personaSel = { select: { numero_identidad: true, nombres: true, apellidos: true } } as const;

function nombreFiltro(nombre: string) {
  return {
    OR: [
      { nombres: { contains: nombre, mode: 'insensitive' as const } },
      { apellidos: { contains: nombre, mode: 'insensitive' as const } },
    ],
  };
}

/**
 * Consulta unificada de registros sacramentales agrupables por libro.
 * Tenant-safe: SIEMPRE filtra por parishId. Usa un switch explícito por
 * sacramento (nunca nombres de modelo dinámicos desde input).
 */
export async function consultarLibro(
  parishId: number,
  sacramento: SacramentoLibro,
  filtros: LibroFiltros,
  page: number,
  pageSize: number
): Promise<LibroResultado> {
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  let total = 0;
  let data: LibroRegistro[] = [];

  switch (sacramento) {
    case 'bautismo': {
      const where: import('@prisma/client').Prisma.BautismoWhereInput = { id_parroquia: parishId };
      if (filtros.libro) where.numero_libro = filtros.libro;
      if (filtros.pagina) where.numero_pagina = filtros.pagina;
      if (filtros.registro) where.numero_registro = filtros.registro;
      if (filtros.dni) where.numero_identidad_bautizado = filtros.dni;
      if (filtros.nombre) where.bautizado = nombreFiltro(filtros.nombre);
      const [t, items] = await Promise.all([
        prisma.bautismo.count({ where }),
        prisma.bautismo.findMany({
          where,
          include: { bautizado: personaSel },
          orderBy: [{ numero_libro: 'asc' }, { numero_registro: 'asc' }],
          skip,
          take,
        }),
      ]);
      total = t;
      data = items.map((b) => ({
        id: b.id_bautismo.toString(),
        sacramento,
        personaPrincipal: b.bautizado,
        personaSecundaria: null,
        fecha: b.fecha_bautismo?.toISOString() ?? null,
        numero_libro: b.numero_libro,
        numero_pagina: b.numero_pagina,
        numero_registro: b.numero_registro,
      }));
      break;
    }
    case 'primera_comunion': {
      const where: import('@prisma/client').Prisma.PrimeraComunionWhereInput = { id_parroquia: parishId };
      if (filtros.libro) where.numero_libro = filtros.libro;
      if (filtros.pagina) where.numero_pagina = filtros.pagina;
      if (filtros.registro) where.numero_registro = filtros.registro;
      if (filtros.dni) where.numero_identidad_persona = filtros.dni;
      if (filtros.nombre) where.persona = nombreFiltro(filtros.nombre);
      const [t, items] = await Promise.all([
        prisma.primeraComunion.count({ where }),
        prisma.primeraComunion.findMany({
          where,
          include: { persona: personaSel },
          orderBy: [{ numero_libro: 'asc' }, { numero_registro: 'asc' }],
          skip,
          take,
        }),
      ]);
      total = t;
      data = items.map((b) => ({
        id: b.id_primera_comunion.toString(),
        sacramento,
        personaPrincipal: b.persona,
        personaSecundaria: null,
        fecha: b.fecha_primera_comunion?.toISOString() ?? null,
        numero_libro: b.numero_libro,
        numero_pagina: b.numero_pagina,
        numero_registro: b.numero_registro,
      }));
      break;
    }
    case 'confirmacion': {
      const where: import('@prisma/client').Prisma.ConfirmacionWhereInput = { id_parroquia: parishId };
      if (filtros.libro) where.numero_libro = filtros.libro;
      if (filtros.pagina) where.numero_pagina = filtros.pagina;
      if (filtros.registro) where.numero_registro = filtros.registro;
      if (filtros.dni) where.numero_identidad_confirmado = filtros.dni;
      if (filtros.nombre) where.confirmado = nombreFiltro(filtros.nombre);
      const [t, items] = await Promise.all([
        prisma.confirmacion.count({ where }),
        prisma.confirmacion.findMany({
          where,
          include: { confirmado: personaSel },
          orderBy: [{ numero_libro: 'asc' }, { numero_registro: 'asc' }],
          skip,
          take,
        }),
      ]);
      total = t;
      data = items.map((b) => ({
        id: b.id_confirmacion.toString(),
        sacramento,
        personaPrincipal: b.confirmado,
        personaSecundaria: null,
        fecha: b.fecha_confirmacion?.toISOString() ?? null,
        numero_libro: b.numero_libro,
        numero_pagina: b.numero_pagina,
        numero_registro: b.numero_registro,
      }));
      break;
    }
    case 'matrimonio': {
      const where: import('@prisma/client').Prisma.MatrimonioWhereInput = { id_parroquia: parishId };
      if (filtros.libro) where.numero_libro = filtros.libro;
      if (filtros.pagina) where.numero_pagina = filtros.pagina;
      if (filtros.registro) where.numero_registro = filtros.registro;
      if (filtros.dni) where.OR = [{ numero_identidad_esposa: filtros.dni }, { numero_identidad_esposo: filtros.dni }];
      if (filtros.nombre) where.OR = [{ esposa: nombreFiltro(filtros.nombre) }, { esposo: nombreFiltro(filtros.nombre) }];
      const [t, items] = await Promise.all([
        prisma.matrimonio.count({ where }),
        prisma.matrimonio.findMany({
          where,
          include: { esposa: personaSel, esposo: personaSel },
          orderBy: [{ numero_libro: 'asc' }, { numero_registro: 'asc' }],
          skip,
          take,
        }),
      ]);
      total = t;
      data = items.map((b) => ({
        id: b.id_matrimonio.toString(),
        sacramento,
        personaPrincipal: b.esposa,
        personaSecundaria: b.esposo,
        fecha: b.fecha_matrimonio?.toISOString() ?? null,
        numero_libro: b.numero_libro,
        numero_pagina: b.numero_pagina,
        numero_registro: b.numero_registro,
      }));
      break;
    }
  }

  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
