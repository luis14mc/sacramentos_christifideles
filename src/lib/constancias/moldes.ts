import { PDFDocument } from 'pdf-lib';
import { prisma } from '@/lib/prisma';
import type { SacramentoConstancia } from '@/lib/constancias';

export const MAX_MOLDE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MOLDE_MIME = 'application/pdf';
export const CAMPO_PDF_REGEX = /^[A-Za-z0-9_]{1,64}$/;
export const TIPOS_CONSTANCIA = ['predeterminado', 'notas', 'institucional'] as const;
export type TipoConstanciaMolde = (typeof TIPOS_CONSTANCIA)[number];

export function esTipoConstanciaMolde(t: string): t is TipoConstanciaMolde {
  return (TIPOS_CONSTANCIA as readonly string[]).includes(t);
}

export interface MoldeResumen {
  id: string;
  sacramento: string;
  tipo_constancia: string;
  nombre: string;
  archivo_nombre: string;
  archivo_mime: string;
  archivo_bytes: number;
  activo: boolean;
  mapa_campos: Record<string, string>;
  created_at: string;
  updated_at: string;
}

function toResumen(row: {
  id: bigint;
  sacramento: string;
  tipo_constancia: string;
  nombre: string;
  archivo_nombre: string;
  archivo_mime: string;
  archivo_bytes: number;
  activo: boolean;
  mapa_campos: unknown;
  created_at: Date;
  updated_at: Date;
}): MoldeResumen {
  return {
    id: row.id.toString(),
    sacramento: row.sacramento,
    tipo_constancia: row.tipo_constancia,
    nombre: row.nombre,
    archivo_nombre: row.archivo_nombre,
    archivo_mime: row.archivo_mime,
    archivo_bytes: row.archivo_bytes,
    activo: row.activo,
    mapa_campos: (row.mapa_campos as Record<string, string>) ?? {},
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  };
}

export interface MoldeCompleto extends MoldeResumen {
  archivo: Uint8Array;
}

export async function listarMoldes(
  idParroquia: number,
  filtros?: { sacramento?: SacramentoConstancia; activo?: boolean }
): Promise<MoldeResumen[]> {
  const where: Record<string, unknown> = { id_parroquia: idParroquia };
  if (filtros?.sacramento) where.sacramento = filtros.sacramento;
  if (typeof filtros?.activo === 'boolean') where.activo = filtros.activo;
  const rows = await prisma.moldeConstancia.findMany({
    where,
    orderBy: [{ sacramento: 'asc' }, { tipo_constancia: 'asc' }, { nombre: 'asc' }],
  });
  return rows.map(toResumen);
}

export async function obtenerMoldeActivo(
  idParroquia: number,
  sacramento: SacramentoConstancia,
  tipoConstancia: string
): Promise<MoldeCompleto | null> {
  const row = await prisma.moldeConstancia.findFirst({
    where: {
      id_parroquia: idParroquia,
      sacramento,
      tipo_constancia: tipoConstancia,
      activo: true,
    },
  });
  if (!row) return null;
  return { ...toResumen(row), archivo: new Uint8Array(row.archivo) };
}

export async function obtenerMoldePorId(
  idParroquia: number,
  id: bigint
): Promise<MoldeCompleto | null> {
  const row = await prisma.moldeConstancia.findFirst({
    where: { id, id_parroquia: idParroquia },
  });
  if (!row) return null;
  return { ...toResumen(row), archivo: new Uint8Array(row.archivo) };
}

/** Lista los nombres de campos AcroForm del PDF. Sirve para construir el mapeo en UI. */
export async function listarCamposAcroForm(pdfBytes: Uint8Array): Promise<string[]> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdf.getForm();
  return form.getFields().map((f) => f.getName());
}

/**
 * Valida que el archivo sea un PDF aceptable:
 * - header %PDF-
 * - tamaño <= MAX_MOLDE_BYTES
 * - tiene al menos un campo AcroForm (no se admiten PDFs escaneados planos)
 * - sin streams /JS o /Launch (defensa contra payloads maliciosos)
 */
export async function validarPdfMolde(pdfBytes: Uint8Array): Promise<void> {
  if (pdfBytes.byteLength === 0) throw new Error('PDF vacío');
  if (pdfBytes.byteLength > MAX_MOLDE_BYTES) {
    throw new Error(`PDF demasiado grande (máx ${MAX_MOLDE_BYTES} bytes)`);
  }
  const header = new TextDecoder('latin1').decode(pdfBytes.subarray(0, 5));
  if (header !== '%PDF-') {
    throw new Error('El archivo no es un PDF válido (header incorrecto)');
  }
  // Heurística barata: rechazar /JS o /Launch sin parsear todo el PDF.
  const sniff = new TextDecoder('latin1').decode(pdfBytes);
  if (/\/(JS|Launch)\b/.test(sniff)) {
    throw new Error('El PDF contiene elementos no permitidos (/JS o /Launch)');
  }
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  } catch (e) {
    throw new Error(`PDF inválido: ${(e as Error).message}`);
  }
  const form = pdf.getForm();
  if (form.getFields().length === 0) {
    throw new Error('El PDF no contiene campos AcroForm editables');
  }
}

/** Valida claves del PDF y que cada token esté en la lista permitida. */
export function validarMapaCampos(
  mapa: Record<string, string>,
  tokensPermitidos: Set<string>
): void {
  if (typeof mapa !== 'object' || mapa === null || Array.isArray(mapa)) {
    throw new Error('mapa_campos debe ser un objeto { campo_pdf: token }');
  }
  for (const [campo, token] of Object.entries(mapa)) {
    if (!CAMPO_PDF_REGEX.test(campo)) {
      throw new Error(`Nombre de campo PDF inválido: "${campo}"`);
    }
    if (typeof token !== 'string' || !tokensPermitidos.has(token)) {
      throw new Error(`Token desconocido o inválido: "${token}"`);
    }
  }
}

/** Rellena los campos del PDF usando los tokens provistos. */
export async function renderMoldePdf(
  pdfBytes: Uint8Array,
  mapa: Record<string, string>,
  tokens: Record<string, string>
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdf.getForm();
  for (const [campoPdf, token] of Object.entries(mapa)) {
    const field = form.getField(campoPdf);
    const valor = Object.prototype.hasOwnProperty.call(tokens, token) ? tokens[token] : '';
    if (field.constructor.name === 'PDFCheckBox') {
      const cb = form.getCheckBox(campoPdf);
      if (typeof valor === 'string' && valor.toLowerCase() === 'true') {
        cb.check();
      } else {
        cb.uncheck();
      }
    } else if (field.constructor.name === 'PDFDropdown') {
      form.getDropdown(campoPdf).select(String(valor));
    } else {
      form.getTextField(campoPdf).setText(String(valor));
    }
  }
  form.flatten();
  return pdf.save();
}
