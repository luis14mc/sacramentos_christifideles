import { describe, it, expect, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';

// Pruebas puras: no tocan la base de datos.
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

import {
  TOKENS_CONSTANCIA,
  construirTokens,
  elegirFirmante,
  generarConstanciaPdf,
  generarConstanciaMembretada,
  plantillaDefault,
  plantillaIncluyeDatosRegistrales,
  renderPlantilla,
  SACRAMENTOS_CONSTANCIA,
  type ConstanciaData,
} from '@/lib/constancias';
import {
  diaEnLetras,
  fechaEmisionTexto,
  fechaEnLetras,
  numeroALetras,
} from '@/lib/constancias/letras';

const persona = (nombres: string, apellidos: string, dni = '0801') => ({ numero_identidad: dni, nombres, apellidos });

function datos(extra: Partial<ConstanciaData> = {}): ConstanciaData {
  return {
    sacramento: 'bautismo',
    id: '1',
    parroquia: { nombre: 'Cristo Resucitado', direccion: 'Loarque', telefono: '2222-2222', ciudad: 'Distrito Central' },
    parroco: 'Pbro. Juan López',
    vicario: null,
    aliasLiturgico: null,
    logo: null,
    tz: 'America/Tegucigalpa',
    personaPrincipal: {
      ...persona('Ana María', 'Gómez Rivera'),
      fecha_nacimiento: new Date('2005-05-29T00:00:00Z'),
      lugar_nacimiento: 'Tegucigalpa',
      sexo: 'F',
    },
    conyuge: null,
    ministro: persona('Carlos', 'Mejía', '9'),
    // 5 de octubre de 2005, 10:00 en Honduras
    fecha: new Date('2005-10-05T16:00:00Z'),
    numero_acta: null,
    numero_libro: '1',
    numero_pagina: '12',
    numero_folio: '247',
    numero_registro: '981',
    nota_marginal: null,
    padre: persona('José', 'Gómez', 'P1'),
    madre: persona('Lucía', 'Rivera', 'M1'),
    padrino: persona('Mario', 'Castro', 'PD'),
    madrina: persona('Rosa', 'Díaz', 'MD'),
    ...extra,
  };
}

describe('números y fechas en letras', () => {
  it('convierte días y años', () => {
    expect(numeroALetras(1)).toBe('uno');
    expect(numeroALetras(16)).toBe('dieciséis');
    expect(numeroALetras(21)).toBe('veintiuno');
    expect(numeroALetras(22)).toBe('veintidós');
    expect(numeroALetras(31)).toBe('treinta y uno');
    expect(numeroALetras(100)).toBe('cien');
    expect(numeroALetras(1966)).toBe('mil novecientos sesenta y seis');
    expect(numeroALetras(1999)).toBe('mil novecientos noventa y nueve');
    expect(numeroALetras(2000)).toBe('dos mil');
    expect(numeroALetras(2005)).toBe('dos mil cinco');
    expect(numeroALetras(2026)).toBe('dos mil veintiséis');
  });
  it('rechaza valores fuera de rango', () => {
    expect(() => numeroALetras(-1)).toThrow(RangeError);
    expect(() => numeroALetras(10000)).toThrow(RangeError);
    expect(() => numeroALetras(1.5)).toThrow(RangeError);
  });
  it('el día 1 es "primero"', () => {
    expect(diaEnLetras(1)).toBe('primero');
    expect(diaEnLetras(2)).toBe('dos');
  });
  it('fecha en letras respeta la zona horaria', () => {
    // 6 de enero 03:00 UTC = 5 de enero 21:00 en Honduras
    const d = new Date('2026-01-06T03:00:00Z');
    expect(fechaEnLetras(d, 'America/Tegucigalpa')).toBe('cinco de enero de dos mil veintiséis');
    expect(fechaEnLetras(d, 'UTC')).toBe('seis de enero de dos mil veintiséis');
    expect(fechaEnLetras(null, 'UTC')).toBe('');
  });
  it('cierre de emisión', () => {
    expect(fechaEmisionTexto({ dia: 29, mes: 8, anio: 2013 })).toBe('a los veintinueve (29) días del mes de agosto de 2013');
    expect(fechaEmisionTexto({ dia: 1, mes: 12, anio: 2026 })).toBe('al primer (1) día del mes de diciembre de 2026');
  });
});

describe('tokens del formato de la Curia', () => {
  it('cada token de la lista tiene valor y no hay tokens sin declarar', () => {
    const tokens = construirTokens(datos());
    expect(Object.keys(tokens).sort()).toEqual([...TOKENS_CONSTANCIA].sort());
  });

  it('arma filiación, padrinos y fechas en letras', () => {
    const t = construirTokens(datos(), new Date('2026-11-27T18:00:00Z'));
    expect(t['persona.filiacion']).toBe(', hija de José Gómez y de Lucía Rivera');
    expect(t['padrinos.texto']).toBe('Padrinos: Mario Castro y Rosa Díaz.');
    expect(t['padrinos.nombres']).toBe('Mario Castro y Rosa Díaz');
    expect(t.fecha_sacramento_letras).toBe('cinco de octubre de dos mil cinco');
    // La fecha de nacimiento es DATE: no se corre un día por la zona horaria.
    expect(t['persona.fecha_nacimiento_letras']).toBe('veintinueve de mayo de dos mil cinco');
    expect(t.folio).toBe('247');
    expect(t['parroquia.ciudad']).toBe('Distrito Central');
    expect(t['emision.fecha_texto']).toBe('a los veintisiete (27) días del mes de noviembre de 2026');
    expect(t.observaciones).toBe('Ninguna');
  });

  it('sin padres ni padrinos no deja frases rotas', () => {
    const t = construirTokens(datos({ padre: null, madre: null, padrino: null, madrina: null }));
    expect(t['persona.filiacion']).toBe('');
    expect(t['padrinos.texto']).toBe('');
    expect(t['padre.nombre_completo']).toBe('');
  });

  it('un solo progenitor o padrino', () => {
    const t = construirTokens(datos({ padre: null, madrina: null, personaPrincipal: { ...persona('Luis', 'Ramos'), sexo: 'M' } }));
    expect(t['persona.filiacion']).toBe(', hijo de Lucía Rivera');
    expect(t['padrinos.texto']).toBe('Padrino: Mario Castro.');
  });

  it('sexo desconocido usa "hijo(a)"', () => {
    const t = construirTokens(datos({ personaPrincipal: { ...persona('X', 'Y'), sexo: null } }));
    expect(t['persona.hijo_a']).toBe('hijo(a)');
  });

  it('folio cae a la página cuando el libro no lo registra', () => {
    expect(construirTokens(datos({ numero_folio: undefined })).folio).toBe('12');
  });
});

describe('texto por defecto (formato de la Curia)', () => {
  it.each(SACRAMENTOS_CONSTANCIA)('%s: sin tokens desconocidos ni restos de {{ }}', (sacramento) => {
    const plantilla = plantillaDefault(sacramento);
    const usados = [...plantilla.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]);
    for (const token of usados) expect(TOKENS_CONSTANCIA).toContain(token);
    const texto = renderPlantilla(plantilla, construirTokens(datos({ sacramento })));
    expect(texto).not.toMatch(/\{\{|\}\}/);
    expect(texto).toContain('CERTIFICA');
    expect(texto).toContain('Es conforme al original.');
    expect(plantillaIncluyeDatosRegistrales(plantilla)).toBe(true);
  });

  it('bautismo transcribe la partida completa', () => {
    const texto = renderPlantilla(plantillaDefault('bautismo'), construirTokens(datos(), new Date('2026-11-27T18:00:00Z')));
    expect(texto).toContain('Libro de Bautismos No. 1 de este archivo parroquial, Folio 247, Número 981');
    expect(texto).toContain('el Rev. P. Carlos Mejía bautizó solemnemente a Ana María Gómez Rivera');
    expect(texto).toContain('nacido en Tegucigalpa el día veintinueve de mayo de dos mil cinco, hija de José Gómez y de Lucía Rivera.');
    expect(texto).toContain('Padrinos: Mario Castro y Rosa Díaz.');
    expect(texto).toContain('en Distrito Central, a los veintisiete (27) días del mes de noviembre de 2026.');
  });

  it('matrimonio nombra a ambos contrayentes', () => {
    const texto = renderPlantilla(
      plantillaDefault('matrimonio'),
      construirTokens(datos({ sacramento: 'matrimonio', numero_acta: '125', conyuge: persona('Luis', 'Díaz', '2') }))
    );
    expect(texto).toContain('Luis Díaz y Ana María Gómez Rivera celebraron matrimonio sacramental');
    expect(texto).toContain('Acta Número 125');
  });

  it('las plantillas antiguas (sin libro) conservan la lista de datos registrales', () => {
    expect(plantillaIncluyeDatosRegistrales('Hace constar que {{persona.nombre_completo}}')).toBe(false);
  });
});

describe('firmante', () => {
  it('por defecto firma el párroco', () => {
    expect(elegirFirmante({ parroco: 'Pbro. Juan', vicario: null }, 'parroco')).toEqual({
      ok: true,
      firmante: { nombre: 'Pbro. Juan', cargo: 'Párroco' },
    });
  });
  it('puede firmar el vicario si está configurado', () => {
    expect(elegirFirmante({ parroco: 'Pbro. Juan', vicario: 'Pbro. Pedro' }, 'vicario')).toEqual({
      ok: true,
      firmante: { nombre: 'Pbro. Pedro', cargo: 'Vicario parroquial' },
    });
  });
  it('sin párroco o sin vicario no se emite', () => {
    expect(elegirFirmante({ parroco: '  ', vicario: null }, 'parroco').ok).toBe(false);
    expect(elegirFirmante({ parroco: 'Pbro. Juan', vicario: null }, 'vicario').ok).toBe(false);
  });
});

describe('PDF de la certificación', () => {
  const largos = datos({
    personaPrincipal: {
      ...persona('María de los Ángeles Guadalupe', 'Hernández Castellanos de la Fuente'),
      fecha_nacimiento: new Date('1999-12-31T00:00:00Z'),
      lugar_nacimiento: 'Santa Rosa de Copán',
      sexo: 'F',
    },
    padre: persona('Juan Francisco Antonio', 'Hernández Castellanos'),
    madre: persona('María Guadalupe del Carmen', 'de la Fuente Zelaya'),
    padrino: persona('José Roberto Alejandro', 'Martínez Bustillo'),
    madrina: persona('Ana Lucía Fernanda', 'Rodríguez Membreño'),
    nota_marginal: 'Contrajo matrimonio canónico en la Parroquia San Miguel Arcángel el 12 de junio de 2024, libro 8, folio 33, acta 121.',
  });

  it.each(SACRAMENTOS_CONSTANCIA)('%s sin molde: una hoja carta, incluso con nombres largos', async (sacramento) => {
    const d = { ...largos, sacramento, conyuge: persona('Carlos Eduardo José', 'Mejía Turcios', '3') };
    const salida = await generarConstanciaPdf(d, plantillaDefault(sacramento));
    const pdf = await PDFDocument.load(salida);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getSize()).toEqual({ width: 612, height: 792 });
  });

  it('hoja membretada con margen por defecto: conserva la hoja', async () => {
    const hoja = await PDFDocument.create();
    hoja.addPage([612, 792]);
    const salida = await generarConstanciaMembretada(await hoja.save(), largos, plantillaDefault('bautismo'), 170);
    const pdf = await PDFDocument.load(salida);
    expect(pdf.getPageCount()).toBe(1);
  });
});
