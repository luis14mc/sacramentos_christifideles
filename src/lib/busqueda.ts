import { prisma } from '@/lib/prisma';

export interface BusquedaResultado {
  tipo: 'persona' | 'bautismo' | 'primera_comunion' | 'confirmacion' | 'matrimonio';
  id: string;
  titulo: string;
  subtitulo: string;
  dni: string | null;
  fecha: string | null;
  libro: string | null;
  pagina: string | null;
  registro: string | null;
  href: string;
}

export interface BusquedaAgrupada {
  personas: BusquedaResultado[];
  bautismos: BusquedaResultado[];
  primeras_comuniones: BusquedaResultado[];
  confirmaciones: BusquedaResultado[];
  matrimonios: BusquedaResultado[];
  total: number;
}

function nombreFiltro(q: string) {
  return {
    OR: [
      { nombres: { contains: q, mode: 'insensitive' as const } },
      { apellidos: { contains: q, mode: 'insensitive' as const } },
    ],
  };
}

function rangoFechaExacta(q: string): { gte: Date; lt: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(q)) return null;
  const inicio = new Date(`${q}T00:00:00.000Z`);
  if (Number.isNaN(inicio.getTime())) return null;
  const fin = new Date(inicio);
  fin.setUTCDate(fin.getUTCDate() + 1);
  return { gte: inicio, lt: fin };
}

const persona = (p: { numero_identidad: string; nombres: string; apellidos: string } | null) =>
  p ? `${p.nombres} ${p.apellidos}` : '—';

/**
 * Búsqueda global tenant-safe por DNI, nombres, apellidos, libro, registro y
 * fecha exacta (YYYY-MM-DD). Consultas Prisma explícitas por módulo (sin SQL
 * dinámico). Límite por categoría. El tenant proviene SIEMPRE de parishId.
 */
export async function buscarGlobal(parishId: number, q: string, limite = 15): Promise<BusquedaAgrupada> {
  const take = Math.min(50, Math.max(1, limite));
  const fecha = rangoFechaExacta(q);

  const [personas, bautismos, comuniones, confirmaciones, matrimonios] = await Promise.all([
    prisma.persona.findMany({
      where: {
        id_parroquia: parishId,
        OR: [
          { numero_identidad: { contains: q } },
          nombreFiltro(q),
          ...(fecha ? [{ fecha_nacimiento: fecha }] : []),
        ],
      },
      select: { numero_identidad: true, nombres: true, apellidos: true },
      take,
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
    }),
    prisma.bautismo.findMany({
      where: {
        id_parroquia: parishId,
        OR: [
          { numero_identidad_bautizado: q },
          { numero_libro: q },
          { numero_registro: q },
          { bautizado: nombreFiltro(q) },
          ...(fecha ? [{ fecha_bautismo: fecha }] : []),
        ],
      },
      include: { bautizado: { select: { numero_identidad: true, nombres: true, apellidos: true } } },
      take,
      orderBy: { fecha_bautismo: 'desc' },
    }),
    prisma.primeraComunion.findMany({
      where: {
        id_parroquia: parishId,
        OR: [
          { numero_identidad_persona: q },
          { numero_libro: q },
          { numero_registro: q },
          { persona: nombreFiltro(q) },
          ...(fecha ? [{ fecha_primera_comunion: fecha }] : []),
        ],
      },
      include: { persona: { select: { numero_identidad: true, nombres: true, apellidos: true } } },
      take,
      orderBy: { fecha_primera_comunion: 'desc' },
    }),
    prisma.confirmacion.findMany({
      where: {
        id_parroquia: parishId,
        OR: [
          { numero_identidad_confirmado: q },
          { numero_libro: q },
          { numero_registro: q },
          { confirmado: nombreFiltro(q) },
          ...(fecha ? [{ fecha_confirmacion: fecha }] : []),
        ],
      },
      include: { confirmado: { select: { numero_identidad: true, nombres: true, apellidos: true } } },
      take,
      orderBy: { fecha_confirmacion: 'desc' },
    }),
    prisma.matrimonio.findMany({
      where: {
        id_parroquia: parishId,
        OR: [
          { numero_identidad_esposa: q },
          { numero_identidad_esposo: q },
          { numero_libro: q },
          { numero_registro: q },
          { esposa: nombreFiltro(q) },
          { esposo: nombreFiltro(q) },
          ...(fecha ? [{ fecha_matrimonio: fecha }] : []),
        ],
      },
      include: {
        esposa: { select: { numero_identidad: true, nombres: true, apellidos: true } },
        esposo: { select: { numero_identidad: true, nombres: true, apellidos: true } },
      },
      take,
      orderBy: { fecha_matrimonio: 'desc' },
    }),
  ]);

  const rPersonas: BusquedaResultado[] = personas.map((p) => ({
    tipo: 'persona',
    id: p.numero_identidad,
    titulo: persona(p),
    subtitulo: 'Persona',
    dni: p.numero_identidad,
    fecha: null,
    libro: null,
    pagina: null,
    registro: null,
    href: `/personas?dni=${encodeURIComponent(p.numero_identidad)}`,
  }));

  const rBautismos: BusquedaResultado[] = bautismos.map((b) => ({
    tipo: 'bautismo',
    id: b.id_bautismo.toString(),
    titulo: persona(b.bautizado),
    subtitulo: 'Bautismo',
    dni: b.bautizado?.numero_identidad ?? null,
    fecha: b.fecha_bautismo?.toISOString() ?? null,
    libro: b.numero_libro,
    pagina: b.numero_pagina,
    registro: b.numero_registro,
    href: `/bautismos/${b.id_bautismo}`,
  }));

  const rComuniones: BusquedaResultado[] = comuniones.map((b) => ({
    tipo: 'primera_comunion',
    id: b.id_primera_comunion.toString(),
    titulo: persona(b.persona),
    subtitulo: 'Primera Comunión',
    dni: b.persona?.numero_identidad ?? null,
    fecha: b.fecha_primera_comunion?.toISOString() ?? null,
    libro: b.numero_libro,
    pagina: b.numero_pagina,
    registro: b.numero_registro,
    href: `/primeras-comuniones/${b.id_primera_comunion}`,
  }));

  const rConfirmaciones: BusquedaResultado[] = confirmaciones.map((b) => ({
    tipo: 'confirmacion',
    id: b.id_confirmacion.toString(),
    titulo: persona(b.confirmado),
    subtitulo: 'Confirmación',
    dni: b.confirmado?.numero_identidad ?? null,
    fecha: b.fecha_confirmacion?.toISOString() ?? null,
    libro: b.numero_libro,
    pagina: b.numero_pagina,
    registro: b.numero_registro,
    href: `/confirmaciones/${b.id_confirmacion}`,
  }));

  const rMatrimonios: BusquedaResultado[] = matrimonios.map((b) => ({
    tipo: 'matrimonio',
    id: b.id_matrimonio.toString(),
    titulo: `${persona(b.esposa)} & ${persona(b.esposo)}`,
    subtitulo: 'Matrimonio',
    dni: b.esposa?.numero_identidad ?? null,
    fecha: b.fecha_matrimonio?.toISOString() ?? null,
    libro: b.numero_libro,
    pagina: b.numero_pagina,
    registro: b.numero_registro,
    href: `/matrimonios/${b.id_matrimonio}`,
  }));

  return {
    personas: rPersonas,
    bautismos: rBautismos,
    primeras_comuniones: rComuniones,
    confirmaciones: rConfirmaciones,
    matrimonios: rMatrimonios,
    total:
      rPersonas.length +
      rBautismos.length +
      rComuniones.length +
      rConfirmaciones.length +
      rMatrimonios.length,
  };
}
