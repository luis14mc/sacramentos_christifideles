import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { prisma } from '@/lib/prisma';
import { flattenMinistro, ministroSelect } from '@/lib/sacramentos';
import { fechaEnLetras, fechaEmisionTexto, MESES, numeroALetras, partesFecha } from '@/lib/constancias/letras';

export const SACRAMENTOS_CONSTANCIA = ['bautismo', 'primera_comunion', 'confirmacion', 'matrimonio'] as const;
export type SacramentoConstancia = (typeof SACRAMENTOS_CONSTANCIA)[number];

export function esSacramentoConstancia(s: string): s is SacramentoConstancia {
  return (SACRAMENTOS_CONSTANCIA as readonly string[]).includes(s);
}

const TITULOS: Record<SacramentoConstancia, string> = {
  bautismo: 'CERTIFICACIÓN DE BAUTISMO',
  primera_comunion: 'CERTIFICACIÓN DE PRIMERA COMUNIÓN',
  confirmacion: 'CERTIFICACIÓN DE CONFIRMACIÓN',
  matrimonio: 'CERTIFICACIÓN DE MATRIMONIO',
};

const TZ_DEFAULT = 'America/Tegucigalpa';

interface PersonaLite {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
  /** Solo en la persona principal: datos de nacimiento y sexo para la partida. */
  fecha_nacimiento?: Date | null;
  lugar_nacimiento?: string | null;
  sexo?: string | null;
}

export type CargoFirmante = 'Párroco' | 'Vicario parroquial';
export interface Firmante {
  nombre: string;
  cargo: CargoFirmante;
}

export interface ConstanciaData {
  sacramento: SacramentoConstancia;
  id: string;
  /** `ciudad`: municipio de la parroquia, para "se extiende la presente en {ciudad}". */
  parroquia: { nombre: string; direccion: string; telefono: string; ciudad?: string | null };
  parroco: string | null;
  /** Vicario parroquial configurado (puede firmar en lugar del párroco). */
  vicario?: string | null;
  /** Quién firma esta emisión. Lo decide la ruta (ver `elegirFirmante`). */
  firmante?: Firmante | null;
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
  /** Folio del libro (Bautismo tiene `numero_folio`; los demás usan la página). */
  numero_folio?: string | null;
  padre?: PersonaLite | null;
  madre?: PersonaLite | null;
  padrino?: PersonaLite | null;
  madrina?: PersonaLite | null;
}

const personaSel = { select: { numero_identidad: true, nombres: true, apellidos: true } } as const;
/** Persona principal: además, datos de nacimiento y sexo para la partida. */
const personaPrincipalSel = {
  select: {
    numero_identidad: true,
    nombres: true,
    apellidos: true,
    fecha_nacimiento: true,
    sexo: true,
    municipio_nacimiento: { select: { nombre_municipio: true } },
  },
} as const;

type PersonaPrincipalRow = {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: Date;
  sexo: string;
  municipio_nacimiento: { nombre_municipio: string } | null;
};

function principal(p: PersonaPrincipalRow): PersonaLite {
  return {
    numero_identidad: p.numero_identidad,
    nombres: p.nombres,
    apellidos: p.apellidos,
    fecha_nacimiento: p.fecha_nacimiento,
    lugar_nacimiento: p.municipio_nacimiento?.nombre_municipio ?? null,
    sexo: p.sexo,
  };
}

/**
 * Elige quién firma: el párroco por defecto, o el vicario parroquial si se pide.
 * Según la Arquidiócesis, firma el párroco o, en su defecto, el vicario;
 * nunca el usuario que emite ni el encargado del archivo.
 */
export function elegirFirmante(
  datos: Pick<ConstanciaData, 'parroco' | 'vicario'>,
  solicitado: 'parroco' | 'vicario'
): { ok: true; firmante: Firmante } | { ok: false; error: string } {
  if (solicitado === 'vicario') {
    const vicario = datos.vicario?.trim();
    if (!vicario) return { ok: false, error: 'La parroquia no tiene vicario parroquial configurado' };
    return { ok: true, firmante: { nombre: vicario, cargo: 'Vicario parroquial' } };
  }
  const parroco = datos.parroco?.trim();
  if (!parroco) {
    return { ok: false, error: 'Configure el párroco en Configuración → Datos de la parroquia antes de emitir certificaciones' };
  }
  return { ok: true, firmante: { nombre: parroco, cargo: 'Párroco' } };
}

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
    select: { nombre: true, direccion: true, telefono: true, municipio: { select: { nombre_municipio: true } } },
  });
  const config = await prisma.parroquiaConfig.findUnique({
    where: { id_parroquia: parishId },
    select: {
      alias_liturgico: true,
      parroco_nombre: true,
      vicario_nombre: true,
      tz: true,
      logo_archivo: true,
      logo_mime: true,
    },
  });
  if (!parroquia) return null;

  const base = {
    parroquia: {
      nombre: parroquia.nombre,
      direccion: parroquia.direccion,
      telefono: parroquia.telefono,
      ciudad: parroquia.municipio?.nombre_municipio ?? null,
    },
    parroco: config?.parroco_nombre ?? null,
    vicario: config?.vicario_nombre ?? null,
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
        include: {
          bautizado: personaPrincipalSel,
          padre: personaSel,
          madre: personaSel,
          padrino: personaSel,
          madrina: personaSel,
          sacerdote: { select: ministroSelect },
        },
      });
      if (!r) return null;
      return {
        ...base,
        sacramento,
        id: r.id_bautismo.toString(),
        personaPrincipal: principal(r.bautizado),
        padre: r.padre,
        madre: r.madre,
        padrino: r.padrino,
        madrina: r.madrina,
        numero_folio: r.numero_folio,
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
        include: {
          persona: personaPrincipalSel,
          padre: personaSel,
          madre: personaSel,
          sacerdote: { select: ministroSelect },
        },
      });
      if (!r) return null;
      return {
        ...base,
        sacramento,
        id: r.id_primera_comunion.toString(),
        personaPrincipal: principal(r.persona),
        padre: r.padre,
        madre: r.madre,
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
        include: {
          confirmado: personaPrincipalSel,
          padre: personaSel,
          madre: personaSel,
          padrino: personaSel,
          madrina: personaSel,
          obispo: { select: ministroSelect },
        },
      });
      if (!r) return null;
      return {
        ...base,
        sacramento,
        id: r.id_confirmacion.toString(),
        personaPrincipal: principal(r.confirmado),
        padre: r.padre,
        madre: r.madre,
        padrino: r.padrino,
        madrina: r.madrina,
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
        include: {
          esposa: personaSel,
          esposo: personaSel,
          padrino: personaSel,
          madrina: personaSel,
          sacerdote: { select: ministroSelect },
        },
      });
      if (!r) return null;
      return {
        ...base,
        sacramento,
        id: r.id_matrimonio.toString(),
        personaPrincipal: r.esposa,
        conyuge: r.esposo,
        padrino: r.padrino,
        madrina: r.madrina,
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


/** Zona horaria válida o la predeterminada. */
function tzValida(tz: string): string {
  try {
    new Intl.DateTimeFormat('es', { timeZone: tz });
    return tz;
  } catch {
    return TZ_DEFAULT;
  }
}

const nombreCompleto = (p: PersonaLite | null) => (p ? `${p.nombres} ${p.apellidos}` : '—');
/** Igual que nombreCompleto, pero vacío si la persona no existe (para frases). */
const nombreOVacio = (p: PersonaLite | null | undefined) => (p ? `${p.nombres} ${p.apellidos}`.trim() : '');

function hijoA(sexo: string | null | undefined): string {
  if (sexo === 'F') return 'hija';
  if (sexo === 'M') return 'hijo';
  return 'hijo(a)';
}

/** ", hija de Juan Pérez y de María López" · ", hijo de María López" · "" */
function filiacion(d: ConstanciaData): string {
  const padres = [nombreOVacio(d.padre), nombreOVacio(d.madre)].filter(Boolean);
  if (padres.length === 0) return '';
  return `, ${hijoA(d.personaPrincipal?.sexo)} de ${padres.join(' y de ')}`;
}

/** "Juan Pérez y María López" · "Juan Pérez" · "" */
function nombresPadrinos(d: ConstanciaData): string {
  return [nombreOVacio(d.padrino), nombreOVacio(d.madrina)].filter(Boolean).join(' y ');
}

/** "Padrinos: A y B." · "Padrino: A." · "Madrina: B." · "" */
function textoPadrinos(d: ConstanciaData): string {
  const padrino = nombreOVacio(d.padrino);
  const madrina = nombreOVacio(d.madrina);
  if (padrino && madrina) return `Padrinos: ${padrino} y ${madrina}.`;
  if (padrino) return `Padrino: ${padrino}.`;
  if (madrina) return `Madrina: ${madrina}.`;
  return '';
}

/** Lista cerrada de tokens disponibles. Usada para validar mapeos en moldes. */
export const TOKENS_CONSTANCIA = [
  'parroquia.nombre',
  'parroquia.direccion',
  'parroquia.telefono',
  'parroquia.alias',
  'parroquia.parroco',
  'parroquia.vicario',
  'parroquia.ciudad',
  'persona.nombres',
  'persona.apellidos',
  'persona.dni',
  'persona.nombre_completo',
  'persona.fecha_nacimiento_letras',
  'persona.lugar_nacimiento',
  'persona.hijo_a',
  'persona.filiacion',
  'conyuge.nombre_completo',
  'conyuge.dni',
  'padre.nombre_completo',
  'madre.nombre_completo',
  'padrino.nombre_completo',
  'madrina.nombre_completo',
  'padrinos.nombres',
  'padrinos.texto',
  'fecha_sacramento',
  'fecha_sacramento_letras',
  'libro',
  'folio',
  'pagina',
  'registro',
  'acta',
  'sacerdote.nombre',
  'ministro.nombre',
  'nota_marginal',
  'observaciones',
  'fecha_emision',
  'emision.dia',
  'emision.dia_letras',
  'emision.mes',
  'emision.anio',
  'emision.fecha_texto',
  'firmante.nombre',
  'firmante.cargo',
] as const;

export type TokenConstancia = (typeof TOKENS_CONSTANCIA)[number];

/** Diccionario de placeholders permitidos. Sin eval, sin ejecución de código. */
export function construirTokens(d: ConstanciaData, ahora: Date = new Date()): Record<TokenConstancia, string> {
  const p = d.personaPrincipal;
  const tz = tzValida(d.tz);
  const emision = partesFecha(ahora, tz);
  const firmante = d.firmante ?? (d.parroco ? { nombre: d.parroco, cargo: 'Párroco' as const } : null);
  return {
    'parroquia.nombre': d.parroquia.nombre,
    'parroquia.direccion': d.parroquia.direccion,
    'parroquia.telefono': d.parroquia.telefono,
    'parroquia.alias': d.aliasLiturgico ?? d.parroquia.nombre,
    'parroquia.parroco': d.parroco ?? '—',
    'parroquia.vicario': d.vicario ?? '',
    'parroquia.ciudad': d.parroquia.ciudad ?? '',
    'persona.nombres': p?.nombres ?? '—',
    'persona.apellidos': p?.apellidos ?? '—',
    'persona.dni': p?.numero_identidad ?? '—',
    'persona.nombre_completo': nombreCompleto(p),
    // La fecha de nacimiento es DATE (sin hora): se lee en UTC para no correr un día.
    'persona.fecha_nacimiento_letras': fechaEnLetras(p?.fecha_nacimiento ?? null, 'UTC'),
    'persona.lugar_nacimiento': p?.lugar_nacimiento ?? '',
    'persona.hijo_a': hijoA(p?.sexo),
    'persona.filiacion': filiacion(d),
    'conyuge.nombre_completo': nombreCompleto(d.conyuge),
    'conyuge.dni': d.conyuge?.numero_identidad ?? '—',
    'padre.nombre_completo': nombreOVacio(d.padre),
    'madre.nombre_completo': nombreOVacio(d.madre),
    'padrino.nombre_completo': nombreOVacio(d.padrino),
    'madrina.nombre_completo': nombreOVacio(d.madrina),
    'padrinos.nombres': nombresPadrinos(d),
    'padrinos.texto': textoPadrinos(d),
    fecha_sacramento: fmtFecha(d.fecha, tz),
    fecha_sacramento_letras: fechaEnLetras(d.fecha, tz),
    libro: d.numero_libro,
    folio: d.numero_folio ?? d.numero_pagina ?? '—',
    pagina: d.numero_pagina ?? '—',
    registro: d.numero_registro,
    acta: d.numero_acta ?? '—',
    'sacerdote.nombre': nombreCompleto(d.ministro),
    'ministro.nombre': nombreCompleto(d.ministro),
    nota_marginal: d.nota_marginal ?? '',
    observaciones: d.nota_marginal?.trim() || 'Ninguna',
    fecha_emision: fmtFecha(ahora, tz),
    'emision.dia': String(emision.dia),
    'emision.dia_letras': numeroALetras(emision.dia),
    'emision.mes': MESES[emision.mes - 1],
    'emision.anio': String(emision.anio),
    'emision.fecha_texto': fechaEmisionTexto(emision),
    'firmante.nombre': firmante?.nombre ?? '',
    'firmante.cargo': firmante?.cargo ?? '',
  };
}

/** Reemplazo seguro de placeholders {{token}} por su valor. Tokens desconocidos -> "". */
export function renderPlantilla(contenido: string, tokens: Record<string, string>): string {
  return contenido.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) =>
    Object.prototype.hasOwnProperty.call(tokens, key) ? tokens[key] : ''
  );
}

const ENCABEZADO_CERTIFICA =
  'El infrascrito Cura encargado de la Parroquia {{parroquia.nombre}},\n\nCERTIFICA\n\n';
const CIERRE_CERTIFICACION =
  '\n\nEs conforme al original.\n\n' +
  'Y para los efectos que se deseen y en derecho correspondan, se extiende la presente certificación ' +
  'en {{parroquia.ciudad}}, {{emision.fecha_texto}}.';

/**
 * Texto por defecto con el formato de la Arquidiócesis de Tegucigalpa
 * (moldes unificados, nov-2026). La parroquia puede reemplazarlo desde
 * Configuración → Constancias.
 */
export function plantillaDefault(sacramento: SacramentoConstancia): string {
  const cuerpo: Record<SacramentoConstancia, string> = {
    bautismo:
      'Que en el Libro de Bautismos No. {{libro}} de este archivo parroquial, Folio {{folio}}, Número {{registro}}, ' +
      'se encuentra la partida que literalmente dice:\n\n' +
      '«El día {{fecha_sacramento_letras}}, en {{parroquia.ciudad}}, Parroquia {{parroquia.nombre}}, ' +
      'el Rev. P. {{ministro.nombre}} bautizó solemnemente a {{persona.nombre_completo}}, ' +
      'que dijeron haber nacido en {{persona.lugar_nacimiento}} el día {{persona.fecha_nacimiento_letras}}' +
      '{{persona.filiacion}}.\n\n{{padrinos.texto}}»',
    primera_comunion:
      'Que en el Libro de Primeras Comuniones No. {{libro}} de este archivo parroquial, Folio {{folio}}, ' +
      'Número {{registro}}, se encuentra la partida que literalmente dice:\n\n' +
      '«El día {{fecha_sacramento_letras}}, en {{parroquia.ciudad}}, Parroquia {{parroquia.nombre}}, ' +
      'el Rev. P. {{ministro.nombre}} administró el sacramento de la Primera Comunión a {{persona.nombre_completo}}, ' +
      'que nació en {{persona.lugar_nacimiento}} el día {{persona.fecha_nacimiento_letras}}{{persona.filiacion}}.»',
    confirmacion:
      'Que en el Libro de Confirmaciones No. {{libro}} de este archivo parroquial, Folio {{folio}}, ' +
      'Número {{registro}}, se encuentra la partida que literalmente dice:\n\n' +
      '«El día {{fecha_sacramento_letras}}, en {{parroquia.ciudad}}, Parroquia {{parroquia.nombre}}, ' +
      'Monseñor {{ministro.nombre}} confirmó solemnemente a {{persona.nombre_completo}}, ' +
      'que nació en {{persona.lugar_nacimiento}} el día {{persona.fecha_nacimiento_letras}}{{persona.filiacion}}.' +
      '\n\n{{padrinos.texto}}»',
    matrimonio:
      'Que en el Libro de Matrimonios No. {{libro}} de este archivo parroquial, Folio {{folio}}, ' +
      'Acta Número {{acta}}, se encuentra la partida que literalmente dice:\n\n' +
      '«El suscrito párroco de la Parroquia {{parroquia.nombre}} hace constar que {{conyuge.nombre_completo}} ' +
      'y {{persona.nombre_completo}} celebraron matrimonio sacramental en esta parroquia el día ' +
      '{{fecha_sacramento_letras}}, en presencia del Rev. P. {{ministro.nombre}}, siendo sus padrinos ' +
      '{{padrinos.nombres}}.»',
  };
  return ENCABEZADO_CERTIFICA + cuerpo[sacramento] + CIERRE_CERTIFICACION;
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

/**
 * Las plantillas que ya citan el libro ({{libro}}) traen la partida completa:
 * no se repite la lista de datos registrales ni la línea "Emitida el …".
 * Las plantillas antiguas (frase corta sin libro) conservan esa lista.
 */
export function plantillaIncluyeDatosRegistrales(contenido: string): boolean {
  return /\{\{\s*libro\s*\}\}/.test(contenido);
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

/** Tamaño carta (8.5 × 11 in), el usual en Honduras y en el papel sellado de la Curia. */
const CARTA: [number, number] = [612, 792];
const MARGEN_LATERAL = 64;

interface Fuentes {
  normal: PDFFont;
  negrita: PDFFont;
}

/**
 * Dibuja título, cuerpo, firma y observaciones a partir de `yInicio`. Lo
 * comparten la constancia sin molde y la hoja membretada. `contenido` es la
 * plantilla sin renderizar (decide si se agregan los datos registrales).
 */
function dibujarCuerpo(
  page: PDFPage,
  f: Fuentes,
  datos: ConstanciaData,
  contenido: string,
  cuerpo: string,
  yInicio: number
): void {
  const margin = MARGEN_LATERAL;
  const width = page.getWidth() - margin * 2;
  const negro = rgb(0.1, 0.1, 0.1);
  const centrar = (texto: string, font: PDFFont, size: number) => {
    const w = font.widthOfTextAtSize(texto, size);
    page.drawText(texto, { x: margin + (width - w) / 2, y, size, font, color: negro });
  };
  let y = yInicio;

  centrar(TITULOS[datos.sacramento], f.negrita, 14);
  y -= 34;

  for (const linea of wrapText(cuerpo, f.normal, 12, width)) {
    if (linea === '') {
      y -= 9; // separación entre párrafos
      continue;
    }
    if (linea === 'CERTIFICA') {
      centrar(linea, f.negrita, 12);
    } else {
      page.drawText(linea, { x: margin, y, size: 12, font: f.normal, color: negro });
    }
    y -= 18;
  }

  if (!plantillaIncluyeDatosRegistrales(contenido)) {
    // Plantilla antigua (frase corta): se agregan los datos registrales.
    y -= 16;
    const datosLinea: [string, string][] = [
      ['Libro', datos.numero_libro],
      ['Página', datos.numero_pagina ?? '—'],
      ['Registro', datos.numero_registro],
      ['Acta', datos.numero_acta ?? '—'],
      ['Fecha del sacramento', fmtFecha(datos.fecha, tzValida(datos.tz))],
      ['Ministro', nombreCompleto(datos.ministro)],
    ];
    for (const [k, v] of datosLinea) {
      page.drawText(`${k}:`, { x: margin, y, size: 11, font: f.negrita, color: negro });
      page.drawText(v, { x: margin + 150, y, size: 11, font: f.normal, color: negro });
      y -= 16;
    }
    y -= 24;
    page.drawText(`Emitida el ${fmtFecha(new Date(), tzValida(datos.tz))}`, { x: margin, y, size: 10, font: f.normal, color: negro });
  }

  // Firma: párroco o vicario parroquial (nunca el usuario que emite).
  const firmante = datos.firmante ?? (datos.parroco ? { nombre: datos.parroco, cargo: 'Párroco' as const } : null);
  y -= 64;
  const firmaW = 240;
  const firmaX = margin + (width - firmaW) / 2;
  page.drawLine({ start: { x: firmaX, y }, end: { x: firmaX + firmaW, y }, thickness: 0.8, color: negro });
  y -= 14;
  centrar(firmante ? `P. ${firmante.nombre.replace(/^(P\.|Pbro\.|Padre)\s+/i, '')}` : 'Párroco', f.normal, 11);
  if (firmante) {
    y -= 13;
    centrar(firmante.cargo, f.normal, 10);
  }

  // Observaciones (nota marginal de la partida).
  y -= 36;
  page.drawText('Observaciones:', { x: margin, y, size: 11, font: f.negrita, color: negro });
  const obs = datos.nota_marginal?.trim() || 'Ninguna.';
  const xObs = margin + f.negrita.widthOfTextAtSize('Observaciones: ', 11);
  const lineasObs = wrapText(obs, f.normal, 11, width - (xObs - margin));
  for (const linea of lineasObs) {
    page.drawText(linea, { x: xObs, y, size: 11, font: f.normal, color: negro });
    y -= 15;
  }
}

async function fuentes(pdf: PDFDocument): Promise<Fuentes> {
  return {
    normal: await pdf.embedFont(StandardFonts.TimesRoman),
    negrita: await pdf.embedFont(StandardFonts.TimesRomanBold),
  };
}

/** Margen superior por defecto al imprimir sobre el papel sellado de la Curia (puntos). */
export const MARGEN_PAPEL_CURIA = 170;

/**
 * Certificación para imprimir sobre el papel sellado de la Curia: hoja carta en
 * blanco, sin logo ni encabezado (el papel ya trae el membrete), con el texto
 * a partir de `margenSuperior`.
 */
export async function generarConstanciaPapelCuria(
  datos: ConstanciaData,
  contenidoPlantilla: string,
  margenSuperior: number = MARGEN_PAPEL_CURIA
): Promise<Uint8Array> {
  const cuerpo = renderPlantilla(contenidoPlantilla, construirTokens(datos));
  const pdf = await PDFDocument.create();
  const page = pdf.addPage(CARTA);
  const f = await fuentes(pdf);
  dibujarCuerpo(page, f, datos, contenidoPlantilla, cuerpo, page.getHeight() - margenSuperior);
  return pdf.save();
}

/** Constancia sin molde: encabezado con logo y datos de la parroquia. */
export async function generarConstanciaPdf(datos: ConstanciaData, contenidoPlantilla: string): Promise<Uint8Array> {
  const cuerpo = renderPlantilla(contenidoPlantilla, construirTokens(datos));
  const pdf = await PDFDocument.create();
  const page = pdf.addPage(CARTA);
  const f = await fuentes(pdf);
  const margin = MARGEN_LATERAL;
  const width = page.getWidth() - margin * 2;
  const negro = rgb(0.1, 0.1, 0.1);
  let y = page.getHeight() - 48;

  if (datos.logo) {
    try {
      const img = datos.logo.mime === 'image/png' ? await pdf.embedPng(datos.logo.bytes) : await pdf.embedJpg(datos.logo.bytes);
      const alto = 56;
      const ancho = (img.width / img.height) * alto;
      page.drawImage(img, { x: margin + (width - ancho) / 2, y: y - alto, width: ancho, height: alto });
      y -= alto + 14;
    } catch (e) {
      console.error('No se pudo insertar el logo en la constancia:', e);
    }
  }

  const centrar = (texto: string, font: PDFFont, size: number) => {
    const w = font.widthOfTextAtSize(texto, size);
    page.drawText(texto, { x: margin + (width - w) / 2, y, size, font, color: negro });
  };
  const nombreParroquia = datos.aliasLiturgico || datos.parroquia.nombre;
  const encabezado = /^parroquia\b/i.test(nombreParroquia) ? nombreParroquia : `Parroquia ${nombreParroquia}`;
  centrar(encabezado.toUpperCase(), f.negrita, 15);
  y -= 18;
  if (datos.parroquia.direccion) {
    centrar(datos.parroquia.direccion, f.normal, 10);
    y -= 13;
  }
  if (datos.parroquia.telefono) {
    centrar(`Tel. ${datos.parroquia.telefono}`, f.normal, 10);
    y -= 13;
  }
  y -= 18;

  dibujarCuerpo(page, f, datos, contenidoPlantilla, cuerpo, y);
  return pdf.save();
}

/**
 * Hoja membretada: PDF sin campos rellenables (por ejemplo, el papel sellado
 * de la Curia escaneado). Se conserva su diseño y se escribe la certificación
 * en la primera página, debajo del margen superior configurado en el molde.
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
  dibujarCuerpo(page, f, datos, contenidoPlantilla, cuerpo, page.getHeight() - margenSuperior);
  return pdf.save();
}
