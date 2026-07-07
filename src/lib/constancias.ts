import type { TenantDb } from '@/lib/prisma-tenant';

export type SacramentoConstanciaTipo =
  | 'bautismo'
  | 'primera_comunion'
  | 'confirmacion'
  | 'matrimonio';

export const SACRAMENTO_LABELS: Record<SacramentoConstanciaTipo, string> = {
  bautismo: 'Bautismo',
  primera_comunion: 'Primera Comunión',
  confirmacion: 'Confirmación',
  matrimonio: 'Matrimonio',
};

export interface ConstanciaVariables {
  parroquia_nombre: string;
  alias_liturgico: string;
  pie_constancia: string;
  fecha_emision: string;
  nombre_completo: string;
  numero_identidad: string;
  fecha_sacramento: string;
  tipo_sacramento: string;
  numero_libro: string;
  numero_registro: string;
  numero_folio: string;
  numero_acta: string;
  celebrante: string;
  nota_marginal: string;
  esposo_nombre: string;
  esposa_nombre: string;
}

const DEFAULT_TEMPLATES: Record<SacramentoConstanciaTipo, string> = {
  bautismo: `<div class="constancia">
<h2>{{alias_liturgico}}</h2>
<p><strong>CONSTANCIA DE BAUTISMO</strong></p>
<p>La Parroquia <strong>{{parroquia_nombre}}</strong> hace constar que:</p>
<p><strong>{{nombre_completo}}</strong>, identidad <strong>{{numero_identidad}}</strong>,
fue bautizado(a) el <strong>{{fecha_sacramento}}</strong>.</p>
<p>Libro: {{numero_libro}} | Folio: {{numero_folio}} | Registro: {{numero_registro}}</p>
<p>Celebró: {{celebrante}}</p>
<p>{{nota_marginal}}</p>
<p class="pie">{{pie_constancia}}</p>
<p class="fecha">Dado en {{fecha_emision}}.</p>
</div>`,
  primera_comunion: `<div class="constancia">
<h2>{{alias_liturgico}}</h2>
<p><strong>CONSTANCIA DE PRIMERA COMUNIÓN</strong></p>
<p>La Parroquia <strong>{{parroquia_nombre}}</strong> certifica que:</p>
<p><strong>{{nombre_completo}}</strong>, identidad <strong>{{numero_identidad}}</strong>,
recibió la Primera Comunión el <strong>{{fecha_sacramento}}</strong>.</p>
<p>Libro: {{numero_libro}} | Acta: {{numero_acta}} | Registro: {{numero_registro}}</p>
<p>Celebró: {{celebrante}}</p>
<p>{{nota_marginal}}</p>
<p class="pie">{{pie_constancia}}</p>
<p class="fecha">Dado en {{fecha_emision}}.</p>
</div>`,
  confirmacion: `<div class="constancia">
<h2>{{alias_liturgico}}</h2>
<p><strong>CONSTANCIA DE CONFIRMACIÓN</strong></p>
<p>La Parroquia <strong>{{parroquia_nombre}}</strong> certifica que:</p>
<p><strong>{{nombre_completo}}</strong>, identidad <strong>{{numero_identidad}}</strong>,
fue confirmado(a) el <strong>{{fecha_sacramento}}</strong>.</p>
<p>Libro: {{numero_libro}} | Acta: {{numero_acta}} | Registro: {{numero_registro}}</p>
<p>Obispo: {{celebrante}}</p>
<p>{{nota_marginal}}</p>
<p class="pie">{{pie_constancia}}</p>
<p class="fecha">Dado en {{fecha_emision}}.</p>
</div>`,
  matrimonio: `<div class="constancia">
<h2>{{alias_liturgico}}</h2>
<p><strong>CONSTANCIA DE MATRIMONIO</strong></p>
<p>La Parroquia <strong>{{parroquia_nombre}}</strong> certifica el matrimonio de:</p>
<p><strong>{{esposo_nombre}}</strong> y <strong>{{esposa_nombre}}</strong>,
celebrado el <strong>{{fecha_sacramento}}</strong>.</p>
<p>Libro: {{numero_libro}} | Acta: {{numero_acta}} | Registro: {{numero_registro}}</p>
<p>Celebró: {{celebrante}}</p>
<p>{{nota_marginal}}</p>
<p class="pie">{{pie_constancia}}</p>
<p class="fecha">Dado en {{fecha_emision}}.</p>
</div>`,
};

export function getDefaultTemplate(tipo: SacramentoConstanciaTipo): string {
  return DEFAULT_TEMPLATES[tipo];
}

export function renderConstancia(
  template: string,
  variables: Partial<ConstanciaVariables>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key as keyof ConstanciaVariables];
    return value ?? '';
  });
}

function formatFecha(date: Date): string {
  return date.toLocaleDateString('es-HN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function nombreCompleto(p: { nombres: string; apellidos: string }): string {
  return `${p.nombres} ${p.apellidos}`.trim();
}

export interface SacramentoResumen {
  tipo: SacramentoConstanciaTipo;
  id: string;
  fecha: string;
  descripcion: string;
}

export interface BuscarConstanciaResult {
  persona: {
    numero_identidad: string;
    nombres: string;
    apellidos: string;
    sexo: string;
  } | null;
  sacramentos: SacramentoResumen[];
}

export async function buscarSacramentosPorPersona(
  db: TenantDb,
  parishId: number,
  numeroIdentidad: string
): Promise<BuscarConstanciaResult> {
  const persona = await db.persona.findFirst({
    where: { id_parroquia: parishId, numero_identidad: numeroIdentidad },
    select: {
      numero_identidad: true,
      nombres: true,
      apellidos: true,
      sexo: true,
    },
  });

  if (!persona) {
    return { persona: null, sacramentos: [] };
  }

  const sacramentos: SacramentoResumen[] = [];

  const [bautismos, comuniones, confirmaciones, matrimoniosEsposo, matrimoniosEsposa] =
    await Promise.all([
      db.bautismo.findMany({
        where: {
          id_parroquia: parishId,
          numero_identidad_bautizado: numeroIdentidad,
        },
        select: { id_bautismo: true, fecha_bautismo: true, numero_registro: true },
        orderBy: { fecha_bautismo: 'desc' },
      }),
      db.primeraComunion.findMany({
        where: {
          id_parroquia: parishId,
          numero_identidad_persona: numeroIdentidad,
        },
        select: { id_primera_comunion: true, fecha_primera_comunion: true, numero_registro: true },
        orderBy: { fecha_primera_comunion: 'desc' },
      }),
      db.confirmacion.findMany({
        where: {
          id_parroquia: parishId,
          numero_identidad_confirmado: numeroIdentidad,
        },
        select: { id_confirmacion: true, fecha_confirmacion: true, numero_registro: true },
        orderBy: { fecha_confirmacion: 'desc' },
      }),
      db.matrimonio.findMany({
        where: {
          id_parroquia: parishId,
          numero_identidad_esposo: numeroIdentidad,
        },
        include: {
          esposa: { select: { nombres: true, apellidos: true } },
        },
        orderBy: { fecha_matrimonio: 'desc' },
      }),
      db.matrimonio.findMany({
        where: {
          id_parroquia: parishId,
          numero_identidad_esposa: numeroIdentidad,
        },
        include: {
          esposo: { select: { nombres: true, apellidos: true } },
        },
        orderBy: { fecha_matrimonio: 'desc' },
      }),
    ]);

  for (const b of bautismos) {
    sacramentos.push({
      tipo: 'bautismo',
      id: b.id_bautismo.toString(),
      fecha: b.fecha_bautismo.toISOString(),
      descripcion: `Bautismo — Reg. ${b.numero_registro}`,
    });
  }

  for (const c of comuniones) {
    sacramentos.push({
      tipo: 'primera_comunion',
      id: c.id_primera_comunion.toString(),
      fecha: c.fecha_primera_comunion.toISOString(),
      descripcion: `Primera Comunión — Reg. ${c.numero_registro}`,
    });
  }

  for (const c of confirmaciones) {
    sacramentos.push({
      tipo: 'confirmacion',
      id: c.id_confirmacion.toString(),
      fecha: c.fecha_confirmacion.toISOString(),
      descripcion: `Confirmación — Reg. ${c.numero_registro}`,
    });
  }

  const matrimoniosIds = new Set<string>();
  for (const m of matrimoniosEsposo) {
    const id = m.id_matrimonio.toString();
    if (matrimoniosIds.has(id)) continue;
    matrimoniosIds.add(id);
    sacramentos.push({
      tipo: 'matrimonio',
      id,
      fecha: m.fecha_matrimonio.toISOString(),
      descripcion: `Matrimonio con ${nombreCompleto(m.esposa)} — Reg. ${m.numero_registro}`,
    });
  }
  for (const m of matrimoniosEsposa) {
    const id = m.id_matrimonio.toString();
    if (matrimoniosIds.has(id)) continue;
    matrimoniosIds.add(id);
    sacramentos.push({
      tipo: 'matrimonio',
      id,
      fecha: m.fecha_matrimonio.toISOString(),
      descripcion: `Matrimonio con ${nombreCompleto(m.esposo)} — Reg. ${m.numero_registro}`,
    });
  }

  sacramentos.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return { persona, sacramentos };
}

export interface GenerarConstanciaInput {
  tipo: SacramentoConstanciaTipo;
  registroId: string;
}

export async function buildConstanciaHtml(
  db: TenantDb,
  parishId: number,
  input: GenerarConstanciaInput
): Promise<{ html: string; titulo: string }> {
  const parroquia = await db.parroquia.findUnique({
    where: { id_parroquia: parishId },
    include: { config: true },
  });

  if (!parroquia) {
    throw new Error('Parroquia no encontrada');
  }

  const opciones = (parroquia.config?.opciones ?? {}) as Record<string, unknown>;
  const pieConstancia =
    typeof opciones.pie_constancia === 'string'
      ? opciones.pie_constancia
      : 'Dada en la Parroquia, a solicitud del interesado.';

  const plantillaDb = await db.plantillaConstancia.findFirst({
    where: {
      id_parroquia: parishId,
      sacramento: input.tipo,
      activo: true,
    },
    orderBy: { updated_at: 'desc' },
  });

  const template = plantillaDb?.contenido ?? getDefaultTemplate(input.tipo);
  const variables = await loadSacramentoVariables(db, parishId, input);

  const html = renderConstancia(template, {
    parroquia_nombre: parroquia.nombre,
    alias_liturgico: parroquia.config?.alias_liturgico ?? parroquia.nombre,
    pie_constancia: pieConstancia,
    fecha_emision: formatFecha(new Date()),
    tipo_sacramento: SACRAMENTO_LABELS[input.tipo],
    ...variables,
  });

  return {
    html,
    titulo: `Constancia de ${SACRAMENTO_LABELS[input.tipo]}`,
  };
}

async function loadSacramentoVariables(
  db: TenantDb,
  parishId: number,
  input: GenerarConstanciaInput
): Promise<Partial<ConstanciaVariables>> {
  const empty = {
    numero_folio: '',
    numero_acta: '',
    esposo_nombre: '',
    esposa_nombre: '',
    nota_marginal: '',
  };

  switch (input.tipo) {
    case 'bautismo': {
      const r = await db.bautismo.findFirst({
        where: {
          id_parroquia: parishId,
          id_bautismo: BigInt(input.registroId),
        },
        include: {
          bautizado: { select: { nombres: true, apellidos: true, numero_identidad: true } },
          sacerdote: { select: { nombres: true, apellidos: true } },
        },
      });
      if (!r) throw new Error('Registro de bautismo no encontrado');
      return {
        ...empty,
        nombre_completo: nombreCompleto(r.bautizado),
        numero_identidad: r.bautizado.numero_identidad,
        fecha_sacramento: formatFecha(r.fecha_bautismo),
        numero_libro: r.numero_libro,
        numero_folio: r.numero_folio,
        numero_registro: r.numero_registro,
        celebrante: nombreCompleto(r.sacerdote),
        nota_marginal: r.nota_marginal ?? '',
      };
    }
    case 'primera_comunion': {
      const r = await db.primeraComunion.findFirst({
        where: {
          id_parroquia: parishId,
          id_primera_comunion: BigInt(input.registroId),
        },
        include: {
          persona: { select: { nombres: true, apellidos: true, numero_identidad: true } },
          sacerdote: { select: { nombres: true, apellidos: true } },
        },
      });
      if (!r) throw new Error('Registro de primera comunión no encontrado');
      return {
        ...empty,
        nombre_completo: nombreCompleto(r.persona),
        numero_identidad: r.persona.numero_identidad,
        fecha_sacramento: formatFecha(r.fecha_primera_comunion),
        numero_libro: r.numero_libro,
        numero_acta: r.numero_acta,
        numero_registro: r.numero_registro,
        celebrante: nombreCompleto(r.sacerdote),
        nota_marginal: r.nota_marginal ?? '',
      };
    }
    case 'confirmacion': {
      const r = await db.confirmacion.findFirst({
        where: {
          id_parroquia: parishId,
          id_confirmacion: BigInt(input.registroId),
        },
        include: {
          confirmado: { select: { nombres: true, apellidos: true, numero_identidad: true } },
          obispo: { select: { nombres: true, apellidos: true } },
        },
      });
      if (!r) throw new Error('Registro de confirmación no encontrado');
      return {
        ...empty,
        nombre_completo: nombreCompleto(r.confirmado),
        numero_identidad: r.confirmado.numero_identidad,
        fecha_sacramento: formatFecha(r.fecha_confirmacion),
        numero_libro: r.numero_libro,
        numero_acta: r.numero_acta,
        numero_registro: r.numero_registro,
        celebrante: nombreCompleto(r.obispo),
        nota_marginal: r.nota_marginal ?? '',
      };
    }
    case 'matrimonio': {
      const r = await db.matrimonio.findFirst({
        where: {
          id_parroquia: parishId,
          id_matrimonio: BigInt(input.registroId),
        },
        include: {
          esposo: { select: { nombres: true, apellidos: true, numero_identidad: true } },
          esposa: { select: { nombres: true, apellidos: true, numero_identidad: true } },
          sacerdote: { select: { nombres: true, apellidos: true } },
        },
      });
      if (!r) throw new Error('Registro de matrimonio no encontrado');
      return {
        ...empty,
        nombre_completo: `${nombreCompleto(r.esposo)} y ${nombreCompleto(r.esposa)}`,
        numero_identidad: `${r.esposo.numero_identidad} / ${r.esposa.numero_identidad}`,
        fecha_sacramento: formatFecha(r.fecha_matrimonio),
        numero_libro: r.numero_libro,
        numero_acta: r.numero_acta,
        numero_registro: r.numero_registro,
        celebrante: nombreCompleto(r.sacerdote),
        esposo_nombre: nombreCompleto(r.esposo),
        esposa_nombre: nombreCompleto(r.esposa),
        nota_marginal: r.nota_marginal ?? '',
      };
    }
    default:
      throw new Error('Tipo de sacramento inválido');
  }
}

export function isSacramentoConstanciaTipo(
  value: string
): value is SacramentoConstanciaTipo {
  return ['bautismo', 'primera_comunion', 'confirmacion', 'matrimonio'].includes(value);
}

export const CONSTANCIA_PRINT_STYLES = `
  body { font-family: Georgia, serif; max-width: 800px; margin: 2rem auto; padding: 2rem; color: #111; }
  .constancia h2 { text-align: center; font-size: 1.25rem; margin-bottom: 1.5rem; }
  .constancia p { line-height: 1.7; margin-bottom: 0.75rem; }
  .constancia .pie { margin-top: 2rem; font-style: italic; }
  .constancia .fecha { text-align: right; margin-top: 2rem; }
  @media print { body { margin: 0; padding: 1.5rem; } }
`;
