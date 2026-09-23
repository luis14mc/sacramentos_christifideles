import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  CAMPO_PDF_REGEX,
  MAX_MOLDE_BYTES,
  TIPOS_CONSTANCIA,
  esTipoConstanciaMolde,
  listarCamposAcroForm,
  renderMoldePdf,
  validarMapaCampos,
  validarPdfMolde,
} from '@/lib/constancias/moldes';
import { TOKENS_CONSTANCIA } from '@/lib/constancias';

async function pdfConCampos(campos: string[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.addPage([300, 300]);
  const form = pdf.getForm();
  for (const nombre of campos) {
    form.createTextField(nombre);
  }
  return pdf.save();
}

describe('moldes · utilidades', () => {
  it('TIPOS_CONSTANCIA contiene los valores esperados', () => {
    expect(TIPOS_CONSTANCIA).toEqual(['predeterminado', 'notas', 'institucional']);
  });

  it('esTipoConstanciaMolde discrimina correctamente', () => {
    expect(esTipoConstanciaMolde('predeterminado')).toBe(true);
    expect(esTipoConstanciaMolde('predeterminado'.toUpperCase())).toBe(false);
    expect(esTipoConstanciaMolde('otro')).toBe(false);
  });

  it('regex de nombre de campo PDF es estricto', () => {
    expect(CAMPO_PDF_REGEX.test('campo_valido_1')).toBe(true);
    expect(CAMPO_PDF_REGEX.test('A')).toBe(true);
    expect(CAMPO_PDF_REGEX.test('con espacio')).toBe(false);
    expect(CAMPO_PDF_REGEX.test('con-punto')).toBe(false);
    expect(CAMPO_PDF_REGEX.test('á')).toBe(false);
    expect(CAMPO_PDF_REGEX.test('a'.repeat(65))).toBe(false);
  });
});

describe('moldes · validarPdfMolde', () => {
  it('acepta un PDF válido con AcroForm', async () => {
    const pdf = await pdfConCampos(['nombre', 'apellido']);
    await expect(validarPdfMolde(pdf)).resolves.toBeUndefined();
  });

  it('rechaza PDF vacío', async () => {
    await expect(validarPdfMolde(new Uint8Array())).rejects.toThrow(/vacío/);
  });

  it('rechaza PDF sin header %PDF-', async () => {
    const falso = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    await expect(validarPdfMolde(falso)).rejects.toThrow(/no es un PDF válido/);
  });

  it('rechaza PDF sin campos AcroForm', async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([300, 300]);
    const bytes = await pdf.save();
    await expect(validarPdfMolde(bytes)).rejects.toThrow(/AcroForm/);
  });

  it('rechaza PDF mayor a MAX_MOLDE_BYTES', async () => {
    const grande = new Uint8Array(MAX_MOLDE_BYTES + 1);
    grande.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    await expect(validarPdfMolde(grande)).rejects.toThrow(/grande/);
  });

  it('rechaza PDF con /JS embebido', async () => {
    const malicioso = new Uint8Array(Buffer.from('%PDF-1.4\n/JS malicious', 'latin1'));
    await expect(validarPdfMolde(malicioso)).rejects.toThrow(/\/JS/);
  });
});

describe('moldes · validarMapaCampos', () => {
  const tokens = new Set<string>(TOKENS_CONSTANCIA);

  it('acepta mapa vacío (borrador)', () => {
    expect(() => validarMapaCampos({}, tokens)).not.toThrow();
  });

  it('rechaza mapa vacío cuando requeridoMinimo=true', () => {
    expect(() => validarMapaCampos({}, tokens, { requeridoMinimo: true })).toThrow(/vacío/);
  });

  it('acepta mapa con tokens permitidos', () => {
    expect(() =>
      validarMapaCampos({ nombre: 'persona.nombre_completo', dni: 'persona.dni' }, tokens)
    ).not.toThrow();
  });

  it('rechaza mapa con token desconocido', () => {
    expect(() =>
      validarMapaCampos({ x: 'persona.dni', y: 'no.existe' }, tokens)
    ).toThrow(/Token desconocido/);
  });

  it('rechaza campo PDF con caracteres no permitidos', () => {
    expect(() =>
      validarMapaCampos({ 'campo con espacio': 'persona.dni' }, tokens)
    ).toThrow(/Nombre de campo PDF inválido/);
  });

  it('rechaza mapa que no es objeto', () => {
    expect(() => validarMapaCampos([] as unknown as Record<string, string>, tokens)).toThrow();
    expect(() =>
      validarMapaCampos(null as unknown as Record<string, string>, tokens)
    ).toThrow();
  });

  it('rechaza campo que no existe en el PDF', () => {
    const existentes = new Set(['real_a', 'real_b']);
    expect(() =>
      validarMapaCampos(
        { fantasma: 'persona.dni' },
        tokens,
        { camposExistentes: existentes }
      )
    ).toThrow(/no existe en el PDF/);
  });

  it('combina requeridoMinimo + camposExistentes', () => {
    const existentes = new Set(['campo_ok']);
    expect(() =>
      validarMapaCampos(
        { campo_ok: 'persona.dni' },
        tokens,
        { requeridoMinimo: true, camposExistentes: existentes }
      )
    ).not.toThrow();
  });
});

describe('moldes · listarCamposAcroForm', () => {
  it('devuelve los nombres de los campos creados', async () => {
    const pdf = await pdfConCampos(['a', 'b_campo', 'c1']);
    const campos = await listarCamposAcroForm(pdf);
    expect(campos.sort()).toEqual(['a', 'b_campo', 'c1']);
  });
});

describe('moldes · renderMoldePdf', () => {
  it('rellena campos de texto y devuelve un PDF', async () => {
    const pdfBase = await pdfConCampos(['nombre', 'apellido']);
    const tokens = { nombre: 'Juan', apellido: 'Pérez' };
    const resultado = await renderMoldePdf(pdfBase, { nombre: 'nombre', apellido: 'apellido' }, tokens);
    expect(resultado.byteLength).toBeGreaterThan(100);
    expect(Buffer.from(resultado.subarray(0, 4)).toString('latin1')).toBe('%PDF');
  });

  it('omite campos no presentes en el PDF sin fallar', async () => {
    const pdfBase = await pdfConCampos(['solo']);
    const tokens = { solo: 'X', ignorar: 'Y' };
    const resultado = await renderMoldePdf(pdfBase, { solo: 'solo' }, tokens);
    expect(Buffer.from(resultado.subarray(0, 4)).toString('latin1')).toBe('%PDF');
  });
});
