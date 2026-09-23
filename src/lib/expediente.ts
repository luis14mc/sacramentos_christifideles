import { prisma } from '@/lib/prisma';
import type { SacramentoConstancia } from '@/lib/constancias';

export type TipoExpedienteSacramento =
  | 'bautismo'
  | 'primera_comunion'
  | 'confirmacion'
  | 'matrimonio';

export interface ExpedienteEntrada {
  tipo: TipoExpedienteSacramento;
  /** Slug para constancias PDF */
  sacramentoConstancia: SacramentoConstancia;
  id: string;
  titulo: string;
  rol: string;
  fecha: string | null;
  libro: string;
  pagina: string | null;
  registro: string;
  folio: string | null;
  href: string;
}

export interface ExpedientePersona {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
  entradas: ExpedienteEntrada[];
}

function byFechaDesc(a: ExpedienteEntrada, b: ExpedienteEntrada): number {
  const ta = a.fecha ? Date.parse(a.fecha) : 0;
  const tb = b.fecha ? Date.parse(b.fecha) : 0;
  return tb - ta;
}

/**
 * Sacramentos en los que la persona es sujeto principal (bautizado, confirmado, cónyuge, etc.)
 * dentro de la parroquia indicada.
 */
export async function cargarExpedientePersona(
  idParroquia: number,
  numeroIdentidad: string
): Promise<ExpedientePersona | null> {
  const persona = await prisma.persona.findUnique({
    where: {
      id_parroquia_numero_identidad: {
        id_parroquia: idParroquia,
        numero_identidad: numeroIdentidad,
      },
    },
    select: {
      numero_identidad: true,
      nombres: true,
      apellidos: true,
    },
  });

  if (!persona) return null;

  const [bautismos, comuniones, confirmaciones, matrimonios] = await Promise.all([
    prisma.bautismo.findMany({
      where: {
        id_parroquia: idParroquia,
        numero_identidad_bautizado: numeroIdentidad,
      },
      select: {
        id_bautismo: true,
        fecha_bautismo: true,
        numero_libro: true,
        numero_pagina: true,
        numero_registro: true,
        numero_folio: true,
      },
      orderBy: { fecha_bautismo: 'desc' },
    }),
    prisma.primeraComunion.findMany({
      where: {
        id_parroquia: idParroquia,
        numero_identidad_persona: numeroIdentidad,
      },
      select: {
        id_primera_comunion: true,
        fecha_primera_comunion: true,
        numero_libro: true,
        numero_pagina: true,
        numero_registro: true,
      },
      orderBy: { fecha_primera_comunion: 'desc' },
    }),
    prisma.confirmacion.findMany({
      where: {
        id_parroquia: idParroquia,
        numero_identidad_confirmado: numeroIdentidad,
      },
      select: {
        id_confirmacion: true,
        fecha_confirmacion: true,
        numero_libro: true,
        numero_pagina: true,
        numero_registro: true,
      },
      orderBy: { fecha_confirmacion: 'desc' },
    }),
    prisma.matrimonio.findMany({
      where: {
        id_parroquia: idParroquia,
        OR: [
          { numero_identidad_esposo: numeroIdentidad },
          { numero_identidad_esposa: numeroIdentidad },
        ],
      },
      select: {
        id_matrimonio: true,
        fecha_matrimonio: true,
        numero_libro: true,
        numero_pagina: true,
        numero_registro: true,
        numero_identidad_esposo: true,
        numero_identidad_esposa: true,
        esposo: { select: { nombres: true, apellidos: true } },
        esposa: { select: { nombres: true, apellidos: true } },
      },
      orderBy: { fecha_matrimonio: 'desc' },
    }),
  ]);

  const entradas: ExpedienteEntrada[] = [];

  for (const b of bautismos) {
    entradas.push({
      tipo: 'bautismo',
      sacramentoConstancia: 'bautismo',
      id: b.id_bautismo.toString(),
      titulo: 'Bautismo',
      rol: 'Bautizado/a',
      fecha: b.fecha_bautismo?.toISOString() ?? null,
      libro: b.numero_libro,
      pagina: b.numero_pagina,
      registro: b.numero_registro,
      folio: b.numero_folio,
      href: `/bautismos/${b.id_bautismo}`,
    });
  }

  for (const c of comuniones) {
    entradas.push({
      tipo: 'primera_comunion',
      sacramentoConstancia: 'primera_comunion',
      id: c.id_primera_comunion.toString(),
      titulo: 'Primera Comunión',
      rol: 'Comulgante',
      fecha: c.fecha_primera_comunion?.toISOString() ?? null,
      libro: c.numero_libro,
      pagina: c.numero_pagina,
      registro: c.numero_registro,
      folio: null,
      href: `/primeras-comuniones/${c.id_primera_comunion}`,
    });
  }

  for (const c of confirmaciones) {
    entradas.push({
      tipo: 'confirmacion',
      sacramentoConstancia: 'confirmacion',
      id: c.id_confirmacion.toString(),
      titulo: 'Confirmación',
      rol: 'Confirmado/a',
      fecha: c.fecha_confirmacion?.toISOString() ?? null,
      libro: c.numero_libro,
      pagina: c.numero_pagina,
      registro: c.numero_registro,
      folio: null,
      href: `/confirmaciones/${c.id_confirmacion}`,
    });
  }

  for (const m of matrimonios) {
    const esEsposo = m.numero_identidad_esposo === numeroIdentidad;
    const rol = esEsposo ? 'Esposo' : 'Esposa';
    const contrayente = esEsposo ? m.esposa : m.esposo;
    const subtitulo = `${contrayente.nombres} ${contrayente.apellidos}`.trim();
    entradas.push({
      tipo: 'matrimonio',
      sacramentoConstancia: 'matrimonio',
      id: m.id_matrimonio.toString(),
      titulo: subtitulo ? `Matrimonio con ${subtitulo}` : 'Matrimonio',
      rol,
      fecha: m.fecha_matrimonio?.toISOString() ?? null,
      libro: m.numero_libro,
      pagina: m.numero_pagina,
      registro: m.numero_registro,
      folio: null,
      href: `/matrimonios/${m.id_matrimonio}`,
    });
  }

  entradas.sort(byFechaDesc);

  return {
    numero_identidad: persona.numero_identidad,
    nombres: persona.nombres,
    apellidos: persona.apellidos,
    entradas,
  };
}
