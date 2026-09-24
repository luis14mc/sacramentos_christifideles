import { describe, it, expect, afterAll, afterEach } from 'vitest';
import { GET } from '@/app/api/instancia/route';
import { leerCodigoInstancia, leerParroquiaDesdeEnv } from '@/lib/instancia-env';
import { prisma } from '@/lib/prisma';

describe('leerParroquiaDesdeEnv', () => {
  it('usa Cristo Resucitado cuando PARROQUIA_NOMBRE no está definida', () => {
    expect(leerParroquiaDesdeEnv({})).toMatchObject({
      nombre: 'Cristo Resucitado de Loarque',
      ubicacion: '0801',
    });
  });

  it('ignora el resto de variables si falta el nombre (no mezcla parroquias)', () => {
    const data = leerParroquiaDesdeEnv({ PARROQUIA_DIRECCION: 'Cerro Grande' });
    expect(data.direccion).toBe('Loarque, Distrito Central, Francisco Morazán');
  });

  it('toma los valores del entorno', () => {
    expect(
      leerParroquiaDesdeEnv({
        PARROQUIA_NOMBRE: '  Salvador del Mundo de Cerro Grande ',
        PARROQUIA_DIRECCION: 'Cerro Grande, Distrito Central',
        PARROQUIA_TELEFONO: '+504 1111-1111',
        PARROQUIA_EMAIL: '',
      })
    ).toEqual({
      nombre: 'Salvador del Mundo de Cerro Grande',
      ubicacion: '0801',
      direccion: 'Cerro Grande, Distrito Central',
      telefono: '+504 1111-1111',
      email: null,
    });
  });

  it('rechaza un código de municipio inválido', () => {
    expect(() =>
      leerParroquiaDesdeEnv({ PARROQUIA_NOMBRE: 'X', PARROQUIA_UBICACION: '801' })
    ).toThrow(/PARROQUIA_UBICACION/);
  });
});

describe('leerCodigoInstancia', () => {
  it('devuelve null si no está definido', () => {
    expect(leerCodigoInstancia({})).toBeNull();
  });

  it('acepta slugs válidos y rechaza inválidos', () => {
    expect(leerCodigoInstancia({ PARROQUIA_CODIGO: 'salvador-del-mundo' })).toBe(
      'salvador-del-mundo'
    );
    expect(() => leerCodigoInstancia({ PARROQUIA_CODIGO: 'Salvador Mundo' })).toThrow();
  });
});

describe('GET /api/instancia', () => {
  const original = process.env.PARROQUIA_CODIGO;
  afterEach(() => {
    if (original === undefined) delete process.env.PARROQUIA_CODIGO;
    else process.env.PARROQUIA_CODIGO = original;
  });

  it('devuelve la identidad pública de la instancia', async () => {
    process.env.PARROQUIA_CODIGO = 'cristo-resucitado';
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-store');
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(['codigo', 'nombre', 'version']);
    expect(body.codigo).toBe('cristo-resucitado');
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
