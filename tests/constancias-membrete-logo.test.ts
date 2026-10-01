import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { PDFDocument } from 'pdf-lib';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as getLogo, POST as postLogo, DELETE as deleteLogo } from '@/app/api/configuracion/parroquia/logo/route';
import { GET as getParroquia } from '@/app/api/configuracion/parroquia/route';
import { generarConstanciaMembretada, generarConstanciaPdf, plantillaDefault, type ConstanciaData } from '@/lib/constancias';
import { validarLogo, MAX_LOGO_BYTES } from '@/lib/logo';

// PNG 1×1 válido
const PNG = Uint8Array.from(
  Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
);
const JPEG_CABECERA = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]);
const GIF = Uint8Array.from(Buffer.from('GIF89a'));

let parishId: number;

function setSession(rol = 'administrador') {
  mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: String(parishId), rol } });
}

function logoReq(bytes: Uint8Array, method = 'POST'): NextRequest {
  const fd = new FormData();
  fd.append('logo', new File([Buffer.from(bytes)], 'logo.png', { type: 'image/png' }));
  return new Request('http://t/api/configuracion/parroquia/logo', { method, body: fd }) as unknown as NextRequest;
}

function datos(extra: Partial<ConstanciaData> = {}): ConstanciaData {
  return {
    sacramento: 'bautismo',
    id: '1',
    parroquia: { nombre: 'Cristo Resucitado', direccion: 'Loarque', telefono: '2222-2222' },
    parroco: 'Pbro. Juan López',
    aliasLiturgico: null,
    logo: null,
    tz: 'America/Tegucigalpa',
    personaPrincipal: { numero_identidad: '0801', nombres: 'Ana', apellidos: 'Gómez' },
    conyuge: null,
    ministro: { numero_identidad: '9', nombres: 'Padre', apellidos: 'X' },
    fecha: new Date('2020-01-01'),
    numero_acta: '1',
    numero_libro: '2',
    numero_pagina: '3',
    numero_registro: '4',
    nota_marginal: null,
    ...extra,
  };
}

beforeAll(async () => {
  await prisma.departamento.upsert({ where: { codigo_departamento: '08' }, update: {}, create: { codigo_departamento: '08', nombre_departamento: 'FM' } });
  await prisma.municipio.upsert({ where: { codigo_municipio: '0801' }, update: {}, create: { codigo_municipio: '0801', codigo_departamento: '08', nombre_municipio: 'DC' } });
  const p = await prisma.parroquia.create({ data: { nombre: 'Logo Test', ubicacion: '0801', direccion: 'x', telefono: '1' } });
  parishId = p.id_parroquia;
});

afterAll(async () => {
  await prisma.bitacoraCrud.deleteMany({ where: { id_parroquia: parishId } });
  await prisma.parroquiaConfig.deleteMany({ where: { id_parroquia: parishId } });
  await prisma.parroquia.delete({ where: { id_parroquia: parishId } });
  await prisma.$disconnect();
});

describe('validarLogo', () => {
  it('acepta PNG y JPEG por su contenido real', () => {
    expect(validarLogo(PNG)).toEqual({ ok: true, mime: 'image/png' });
    expect(validarLogo(JPEG_CABECERA)).toEqual({ ok: true, mime: 'image/jpeg' });
  });
  it('rechaza otros formatos, archivos vacíos y de más de 1 MB', () => {
    expect(validarLogo(GIF).ok).toBe(false);
    expect(validarLogo(new Uint8Array()).ok).toBe(false);
    const grande = new Uint8Array(MAX_LOGO_BYTES + 1);
    grande.set(PNG.subarray(0, 8));
    expect(validarLogo(grande).ok).toBe(false);
  });
});

describe('API del logo', () => {
  it('la secretaria no puede cambiarlo -> 403', async () => {
    setSession('secretaria');
    expect((await postLogo(logoReq(PNG))).status).toBe(403);
  });

  it('rechaza un archivo que no es imagen -> 400', async () => {
    setSession();
    expect((await postLogo(logoReq(GIF))).status).toBe(400);
  });

  it('sube, se ve, aparece en los datos de la parroquia y se quita', async () => {
    setSession();
    expect((await postLogo(logoReq(PNG))).status).toBe(200);

    const img = await getLogo();
    expect(img.status).toBe(200);
    expect(img.headers.get('content-type')).toBe('image/png');
    expect((await (await getParroquia()).json()).tiene_logo).toBe(true);

    const audit = await prisma.bitacoraCrud.findFirst({ where: { id_parroquia: parishId, nombre_tabla: 'parroquia_config' } });
    expect(audit).not.toBeNull();

    const borrar = new Request('http://t/api/configuracion/parroquia/logo', { method: 'DELETE' }) as unknown as NextRequest;
    expect((await deleteLogo(borrar)).status).toBe(200);
    expect((await getLogo()).status).toBe(404);
  });
});

describe('render de constancias', () => {
  it('hoja membretada: conserva páginas y tamaño del PDF original', async () => {
    const hoja = await PDFDocument.create();
    hoja.addPage([612, 792]);
    hoja.addPage([612, 792]);
    const salida = await generarConstanciaMembretada(await hoja.save(), datos(), plantillaDefault('bautismo'), 180);
    const pdf = await PDFDocument.load(salida);
    expect(pdf.getPageCount()).toBe(2);
    expect(pdf.getPage(0).getSize()).toEqual({ width: 612, height: 792 });
  });

  it('constancia sin molde con logo genera un PDF válido', async () => {
    const salida = await generarConstanciaPdf(datos({ logo: { bytes: PNG, mime: 'image/png' } }), plantillaDefault('bautismo'));
    const pdf = await PDFDocument.load(salida);
    expect(pdf.getPageCount()).toBe(1);
  });
});
