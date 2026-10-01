import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { prisma } from '@/lib/prisma';
import { flattenMinistro, ministroSelect } from '@/lib/sacramentos';

export const SACRAMENTOS_CONSTANCIA = ['bautismo', 'primera_comunion', 'confirmacion', 'matrimonio'] as const;
export type SacramentoConstancia = (typeof SACRAMENTOS_CONSTANCIA)[number];

export function esSacramentoConstancia(s: string): s is SacramentoConstancia {
  return (SACRAMENTOS_CONSTANCIA as readonly string[]).includes(s);
}

const TITULOS: Record<SacramentoConstancia, string> = {
  bautismo: 'CONSTANCIA DE BAUTISMO',
  primera_comunion: 'CONSTANCIA DE PRIMERA COMUNIÓN',
  confirmacion: 'CONSTANCIA DE CONFIRMACIÓN',
  matrimonio: 'CONSTANCIA DE MATRIMONIO',
};

const TZ_DEFAULT = 'America/Tegucigalpa';

interface PersonaLite {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
}

export interface ConstanciaData {
  sacramento: SacramentoConstancia;
  id: string;
  parroquia: { nombre: string; direccion: string; telefono: string };
  parroco: string | null;
  aliasLiturgico: string | null;
  /** Logo de la parroquia (PNG/JPEG) para constancias sin hoja membretada. */
  logo: { bytes: Uint8Array; mime: string } | null;
  tz: string;
  personaPrincipal: PersonaLite | null;
  conyuge: PersonaLite | null;
  ministro: PersonaLite | null;
  fecha: Date | null;
  numero_acta: string | null;
  numero_libro: string;
  numero_pagina: string | null;
  numero_registro: string;
  nota_marginal: string | null;
}

const personaSel = { select: { numero_identidad: true, nombres: true, apellidos: true } } as const;

/**
 * Carga los datos de la constancia SIEMPRE dentro del tenant. Un registro de
 * otra parroquia devuelve null (el endpoint responde 404). El cliente nunca
 * aporta datos sacramentales: todo se lee de la base de datos.
 */
export async function cargarDatosConstancia(
  parishId: number,
  sacramento: SacramentoConstancia,
  id: bigint
): Promise<ConstanciaData | null> {
  const parroquia = await prisma.parroquia.findUnique({
    where: { id_parroquia: parishId },
    select: { nombre: true, direccion: true, telefono: true },
  });
  const config = await prisma.parroquiaConfig.findUnique({
    where: { id_parroquia: parishId },
    select: { alias_liturgico: true, parroco_nombre: true, tz: true, logo_archivo: true, logo_mime: true },
  });
  if (!parroquia) return null;

  const base = {
    parroquia,
    parroco: config?.parroco_nombre ?? null,
    aliasLiturgico: config?.alias_liturgico ?? null,
    logo:
      config?.logo_archivo && config.logo_mime
        ? { bytes: new Uint8Array(config.logo_archivo), mime: config.logo_mime }
        : null,
    tz: config?.tz || TZ_DEFAULT,
  };

  switch (sacramento) {
    case 'bautismo': {
      const r = await prisma.bautismo.findFirst({
        where: { id_bautismo: id, id_parroquia: parishId },
        include: { bautizado: personaSel, sacerdote: { select: ministroSelect } },
      });
      if (!r) return null;
      return {
        ...base,
        sacramento,
        id: r.id_bautismo.toString(),
        personaPrincipal: r.bautizado,
        conyuge: null,
        ministro: flattenMinistro(r.sacerdote),
        fecha: r.fecha_bautismo,
        numero_acta: null,
        numero_libro: r.numero_libro,
        numero_pagina: r.numero_pagina,
        numero_registro: r.numero_registro,
        nota_marginal: r.nota_marginal,
      };
    }
    case 'primera_comunion': {
      const r = await prisma.primeraComunion.findFirst({
        where: { id_primera_comunion: id, id_parroquia: parishId },
        include: { persona: personaSel, sacerdote: { select: ministroSelect } },
      });
      if (!r) return null;
      return {
        ...base,
        sacramento,
        id: r.id_primera_comunion.toString(),
        personaPrincipal: r.persona,
        conyuge: null,
        ministro: flattenMinistro(r.sacerdote),
        fecha: r.fecha_primera_comunion,
        numero_acta: r.numero_acta,
        numero_libro: r.numero_libro,
        numero_pagina: r.numero_pagina,
        numero_registro: r.numero_registro,
        nota_marginal: r.nota_marginal,
      };
    }
    case 'confirmacion': {
      const r = await prisma.confirmacion.findFirst({
        where: { id_confirmacion: id, id_parroquia: parishId },
        include: { confirmado: personaSel, obispo: { select: ministroSelect } },
      });
      if (!r) return null;
      return {
        ...base,
        sacramento,
        id: r.id_confirmacion.toString(),
        personaPrincipal: r.confirmado,
        conyuge: null,
        ministro: flattenMinistro(r.obispo),
        fecha: r.fecha_confirmacion,
        numero_acta: r.numero_acta,
        numero_libro: r.numero_libro,
        numero_pagina: r.numero_pagina,
        numero_registro: r.numero_registro,
        nota_marginal: r.nota_marginal,
      };
    }
    case 'matrimonio': {
      const r = await prisma.matrimonio.findFirst({
        where: { id_matrimonio: id, id_parroquia: parishId },
        include: { esposa: personaSel, esposo: personaSel, sacerdote: { select: ministroSelect } },
      });
      if (!r) return null;
      return {
        ...base,
        sacramento,
        id: r.id_matrimonio.toString(),
        personaPrincipal: r.esposa,
        conyuge: r.esposo,
        ministro: flattenMinistro(r.sacerdote),
        fecha: r.fecha_matrimonio,
        numero_acta: r.numero_acta,
        numero_libro: r.numero_libro,
        numero_pagina: r.numero_pagina,
        numero_registro: r.numero_registro,
        nota_marginal: r.nota_marginal,
      };
    }
  }
}

function fmtFecha(fecha: Date | null, tz: string): string {
  if (!fecha) return '—';
  try {
    return new Intl.DateTimeFormat('es', { timeZone: tz, dateStyle: 'long' }).format(fecha);
  } catch {
    return new Intl.DateTimeFormat('es', { timeZone: TZ_DEFAULT, dateStyle: 'long' }).format(fecha);
  }
}

const nombreCompleto = (p: PersonaLite | null) => (p ? `${p.nombres} ${p.apellidos}` : '—');

/** Lista cerrada de tokens disponibles. Usada para validar mapeos en moldes. */
export const TOKENS_CONSTANCIA = [
  'parroquia.nombre',
  'parroquia.direccion',
  'parroquia.telefono',
  'parroquia.alias',
  'parroquia.parroco',
  'persona.nombres',
  'persona.apellidos',
  'persona.dni',
  'persona.nombre_completo',
  'conyuge.nombre_completo',
  'conyuge.dni',
  'fecha_sacramento',
  'libro',
  'pagina',
  'registro',
  'acta',
  'sacerdote.nombre',
  'ministro.nombre',
  'nota_marginal',
  'fecha_emision',
] as const;

export type TokenConstancia = (typeof TOKENS_CONSTANCIA)[number];

/** Diccionario de placeholders permitidos. Sin eval, sin ejecución de código. */
export function construirTokens(d: ConstanciaData): Record<string, string> {
  const p = d.personaPrincipal;
  return {
    'parroquia.nombre': d.parroquia.nombre,
    'parroquia.direccion': d.parroquia.direccion,
    'parroquia.telefono': d.parroquia.telefono,
    'parroquia.alias': d.aliasLiturgico ?? d.parroquia.nombre,
    'parroquia.parroco': d.parroco ?? '—',
    'persona.nombres': p?.nombres ?? '—',
    'persona.apellidos': p?.apellidos ?? '—',
    'persona.dni': p?.numero_identidad ?? '—',
    'persona.nombre_completo': nombreCompleto(p),
    'conyuge.nombre_completo': nombreCompleto(d.conyuge),
    'conyuge.dni': d.conyuge?.numero_identidad ?? '—',
    fecha_sacramento: fmtFecha(d.fecha, d.tz),
    libro: d.numero_libro,
    pagina: d.numero_pagina ?? '—',
    registro: d.numero_registro,
    acta: d.numero_acta ?? '—',
    'sacerdote.nombre': nombreCompleto(d.ministro),
    'ministro.nombre': nombreCompleto(d.ministro),
    nota_marginal: d.nota_marginal ?? '',
    fecha_emision: fmtFecha(new Date(), d.tz),
  };
}

/** Reemplazo seguro de placeholders {{token}} por su valor. Tokens desconocidos -> "". */
export function renderPlantilla(contenido: string, tokens: Record<string, string>): string {
  return contenido.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) =>
    Object.prototype.hasOwnProperty.call(tokens, key) ? tokens[key] : ''
  );
}

/** Plantilla por defecto (fallback en código) si la parroquia no definió una. */
export function plantillaDefault(sacramento: SacramentoConstancia): string {
  if (sacramento === 'matrimonio') {
    return (
      'Hace constar que {{persona.nombre_completo}} (DNI {{persona.dni}}) y ' +
      '{{conyuge.nombre_completo}} (DNI {{conyuge.dni}}) contrajeron el sacramento del ' +
      'Matrimonio el {{fecha_sacramento}}, ante el ministro {{sacerdote.nombre}}, ' +
      'quedando registrado en el libro {{libro}}, página {{pagina}}, registro {{registro}}.'
    );
  }
  const nombreSacramento = {
    bautismo: 'Bautismo',
    primera_comunion: 'Primera Comunión',
    confirmacion: 'Confirmación',
  }[sacramento];
  return (
    `Hace constar que {{persona.nombre_completo}} (DNI {{persona.dni}}) recibió el sacramento de ` +
    `${nombreSacramento} el {{fecha_sacramento}}, ante el ministro {{ministro.nombre}}, ` +
    'quedando registrado en el libro {{libro}}, página {{pagina}}, registro {{registro}}.'
  );
}

/** Obtiene la plantilla activa del tenant o la default en código. */
export async function obtenerPlantilla(
  parishId: number,
  sacramento: SacramentoConstancia
): Promise<string> {
  const plantilla = await prisma.plantillaConstancia.findFirst({
    where: { id_parroquia: parishId, sacramento, activo: true },
    orderBy: { updated_at: 'desc' },
    select: { contenido: true },
  });
  return plantilla?.contenido && plantilla.contenido.trim()
    ? plantilla.contenido
    : plantillaDefault(sacramento);
}

// ---- Render PDF (pdf-lib, sin binarios del sistema; apto para serverless) ----

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const parrafo of text.split('\n')) {
    const palabras = parrafo.split(/\s+/).filter(Boolean);
    let linea = '';
    for (const palabra of palabras) {
      const intento = linea ? `${linea} ${palabra}` : palabra;
      if (font.widthOfTextAtSize(intento, size) > maxWidth && linea) {
        lines.push(linea);
        linea = palabra;
      } else {
        linea = intento;
      }
    }
    lines.push(linea);
  }
  return lines;
}

const A4: [number, number] = [595.28, 841.89];
const MARGEN_LATERAL = 56;

interface Fuentes {
  normal: PDFFont;
  negrita: PDFFont;
}

/**
 * Dibuja título, cuerpo, datos registrales, nota marginal, emisión y firma a
 * partir de `yInicio`. Lo comparten la constancia sin molde y la hoja membretada.
 */
function dibujarCuerpo(page: PDFPage, f: Fuentes, datos: ConstanciaData, cuerpo: string, yInicio: number): void {
  const margin = MARGEN_LATERAL;
  const width = page.getWidth() - margin * 2;
  const negro = rgb(0.1, 0.1, 0.1);
  let y = yInicio;

  const tituloW = f.negrita.widthOfTextAtSize(TITULOS[datos.sacramento], 14);
  page.drawText(TITULOS[datos.sacramento], { x: margin + (width - tituloW) / 2, y, size: 14, font: f.negrita, color: negro });
  y -= 34;

  for (const linea of wrapText(cuerpo, f.normal, 12, width)) {
    page.drawText(linea, { x: margin, y, size: 12, font: f.normal, color: negro });
    y -= 18;
  }
  y -= 16;

  const datosLinea: [string, string][] = [
    ['Libro', datos.numero_libro],
    ['Página', datos.numero_pagina ?? '—'],
    ['Registro', datos.numero_registro],
    ['Acta', datos.numero_acta ?? '—'],
    ['Fecha del sacramento', fmtFecha(datos.fecha, datos.tz)],
    ['Ministro', nombreCompleto(datos.ministro)],
  ];
  for (const [k, v] of datosLinea) {
    page.drawText(`${k}:`, { x: margin, y, size: 11, font: f.negrita, color: negro });
    page.drawText(v, { x: margin + 150, y, size: 11, font: f.normal, color: negro });
    y -= 16;
  }
  if (datos.nota_marginal) {
    y -= 8;
    page.drawText('Nota marginal:', { x: margin, y, size: 11, font: f.negrita, color: negro });
    y -= 16;
    for (const linea of wrapText(datos.nota_marginal, f.normal, 11, width)) {
      page.drawText(linea, { x: margin, y, size: 11, font: f.normal, color: negro });
      y -= 15;
    }
  }

  y -= 24;
  page.drawText(`Emitida el ${fmtFecha(new Date(), datos.tz)}`, { x: margin, y, size: 10, font: f.normal, color: negro });

  // Firma del párroco
  y -= 70;
  const firmaW = 220;
  const firmaX = margin + (width - firmaW) / 2;
  page.drawLine({ start: { x: firmaX, y }, end: { x: firmaX + firmaW, y }, thickness: 0.8, color: negro });
  y -= 14;
  const nombreFirma = datos.parroco || 'Párroco';
  const nfW = f.normal.widthOfTextAtSize(nombreFirma, 11);
  page.drawText(nombreFirma, { x: margin + (width - nfW) / 2, y, size: 11, font: f.normal, color: negro });
  if (datos.parroco) {
    y -= 13;
    const cargoW = f.normal.widthOfTextAtSize('Párroco', 10);
    page.drawText('Párroco', { x: margin + (width - cargoW) / 2, y, size: 10, font: f.normal, color: negro });
  }
}

async function fuentes(pdf: PDFDocument): Promise<Fuentes> {
  return {
    normal: await pdf.embedFont(StandardFonts.Helvetica),
    negrita: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
}

/** Constancia sin molde: encabezado con logo y datos de la parroquia. */
export async function generarConstanciaPdf(datos: ConstanciaData, contenidoPlantilla: string): Promise<Uint8Array> {
  const cuerpo = renderPlantilla(contenidoPlantilla, construirTokens(datos));
  const pdf = await PDFDocument.create();
  const page = pdf.addPage(A4);
  const f = await fuentes(pdf);
  const margin = MARGEN_LATERAL;
  const width = page.getWidth() - margin * 2;
  const negro = rgb(0.1, 0.1, 0.1);
  let y = page.getHeight() - margin;

  if (datos.logo) {
    try {
      const img = datos.logo.mime === 'image/png' ? await pdf.embedPng(datos.logo.bytes) : await pdf.embedJpg(datos.logo.bytes);
      const alto = 64;
      const ancho = (img.width / img.height) * alto;
      page.drawImage(img, { x: margin + (width - ancho) / 2, y: y - alto, width: ancho, height: alto });
      y -= alto + 16;
    } catch (e) {
      console.error('No se pudo insertar el logo en la constancia:', e);
    }
  }

  const centrar = (texto: string, font: PDFFont, size: number) => {
    const w = font.widthOfTextAtSize(texto, size);
    page.drawText(texto, { x: margin + (width - w) / 2, y, size, font, color: negro });
  };
  centrar(datos.aliasLiturgico || datos.parroquia.nombre, f.negrita, 16);
  y -= 20;
  if (datos.parroquia.direccion) {
    centrar(datos.parroquia.direccion, f.normal, 10);
    y -= 14;
  }
  if (datos.parroquia.telefono) {
    centrar(`Tel. ${datos.parroquia.telefono}`, f.normal, 10);
    y -= 14;
  }
  y -= 20;

  dibujarCuerpo(page, f, datos, cuerpo, y);
  return pdf.save();
}

/**
 * Hoja membretada: PDF sin campos rellenables. Se conserva su diseño (logo,
 * encabezado, pie) y se escribe la constancia en la primera página, debajo del
 * margen superior configurado en el molde.
 */
export async function generarConstanciaMembretada(
  hojaPdf: Uint8Array,
  datos: ConstanciaData,
  contenidoPlantilla: string,
  margenSuperior: number
): Promise<Uint8Array> {
  const cuerpo = renderPlantilla(contenidoPlantilla, construirTokens(datos));
  const pdf = await PDFDocument.load(hojaPdf, { ignoreEncryption: true });
  const page = pdf.getPage(0);
  const f = await fuentes(pdf);
  dibujarCuerpo(page, f, datos, cuerpo, page.getHeight() - margenSuperior);
  return pdf.save();
}
