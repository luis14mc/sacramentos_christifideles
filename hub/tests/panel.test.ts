import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { prisma } from '../src/prisma';
import { enrutar } from '../src/router';
import { cifrar } from '../src/cifrado';

const PASS = 'clave-panel-segura-123';
const BASE = 'http://hub.test';

function req(path: string, init: RequestInit & { cookie?: string; origen?: boolean } = {}) {
  const headers = new Headers(init.headers);
  headers.set('host', 'hub.test');
  if (init.cookie) headers.set('cookie', init.cookie);
  if (init.origen !== false && init.method === 'POST') headers.set('origin', BASE);
  return new Request(`${BASE}${path}`, { ...init, headers });
}

function form(datos: Record<string, string>) {
  return { method: 'POST', body: new URLSearchParams(datos).toString(), headers: { 'content-type': 'application/x-www-form-urlencoded' } };
}

async function login(): Promise<string> {
  const res = await enrutar(req('/panel/login', form({ usuario: 'admin@christifideles.org', password: PASS })));
  expect(res.status).toBe(303);
  return res.headers.get('set-cookie')!.split(';')[0];
}

beforeAll(() => {
  process.env.HUB_ADMIN_PASSWORD = PASS;
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});

beforeEach(async () => {
  await prisma.solicitud.deleteMany({});
  await prisma.instancia.deleteMany({});
});

afterAll(async () => {
  await prisma.solicitud.deleteMany({});
  await prisma.instancia.deleteMany({});
  vi.unstubAllGlobals();
  await prisma.$disconnect();
});

describe('panel: acceso', () => {
  it('la raíz y las páginas sin sesión llevan al login', async () => {
    expect((await enrutar(req('/'))).headers.get('location')).toBe('/panel');
    const r = await enrutar(req('/panel'));
    expect(r.status).toBe(303);
    expect(r.headers.get('location')).toBe('/panel/login');
  });

  it('credenciales incorrectas -> 401', async () => {
    const r = await enrutar(req('/panel/login', form({ usuario: 'admin@christifideles.org', password: 'otra-cosa-larga' })));
    expect(r.status).toBe(401);
  });

  it('login correcto da cookie HttpOnly/SameSite y abre el inicio', async () => {
    const res = await enrutar(req('/panel/login', form({ usuario: 'admin@christifideles.org', password: PASS })));
    expect(res.headers.get('set-cookie')).toMatch(/HttpOnly; SameSite=Strict/);
    const cookie = res.headers.get('set-cookie')!.split(';')[0];
    const inicio = await enrutar(req('/panel', { cookie }));
    expect(inicio.status).toBe(200);
    expect(await inicio.text()).toContain('Parroquias activas');
  });

  it('una cookie alterada no sirve', async () => {
    const cookie = await login();
    const r = await enrutar(req('/panel', { cookie: cookie.slice(0, -3) + 'abc' }));
    expect(r.status).toBe(303);
  });

  it('sin HUB_ADMIN_PASSWORD el panel queda deshabilitado', async () => {
    const original = process.env.HUB_ADMIN_PASSWORD;
    process.env.HUB_ADMIN_PASSWORD = '';
    const r = await enrutar(req('/panel/login', form({ usuario: 'admin@christifideles.org', password: '' })));
    expect(r.status).toBe(401);
    expect(await (await enrutar(req('/panel/login'))).text()).toContain('no está habilitado');
    process.env.HUB_ADMIN_PASSWORD = original;
  });
});

describe('panel: parroquias', () => {
  it('registra y muestra la llave una sola vez', async () => {
    const cookie = await login();
    const res = await enrutar(req('/panel/parroquias', { ...form({ codigo: 'salvador-del-mundo', nombre: 'Salvador del Mundo', url: 'https://sdm.test/' }), cookie }));
    expect(res.status).toBe(200);
    const cuerpo = await res.text();
    expect(cuerpo).toContain('INTEROP_SECRET');
    const fila = await prisma.instancia.findUniqueOrThrow({ where: { codigo: 'salvador-del-mundo' } });
    expect(fila.url).toBe('https://sdm.test');
    expect(cuerpo).not.toContain(fila.secreto_cifrado);

    const lista = await (await enrutar(req('/panel/parroquias', { cookie }))).text();
    expect(lista).not.toContain('class="secreto"');
  });

  it('rechaza código inválido o duplicado', async () => {
    const cookie = await login();
    const mal = await enrutar(req('/panel/parroquias', { ...form({ codigo: 'Salvador Mundo', nombre: 'X', url: 'https://x.test' }), cookie }));
    expect(mal.status).toBe(400);
    await enrutar(req('/panel/parroquias', { ...form({ codigo: 'a', nombre: 'A', url: 'https://a.test' }), cookie }));
    const dup = await enrutar(req('/panel/parroquias', { ...form({ codigo: 'a', nombre: 'A', url: 'https://a.test' }), cookie }));
    expect(dup.status).toBe(400);
  });

  it('suspender y rotar llave', async () => {
    const cookie = await login();
    await prisma.instancia.create({ data: { codigo: 'a', nombre: 'A', url: 'https://a.test', secreto_cifrado: cifrar('viejo') } });
    await enrutar(req('/panel/parroquias/a/suspender', { method: 'POST', cookie }));
    expect((await prisma.instancia.findUniqueOrThrow({ where: { codigo: 'a' } })).activa).toBe(false);

    const antes = (await prisma.instancia.findUniqueOrThrow({ where: { codigo: 'a' } })).secreto_cifrado;
    const rot = await enrutar(req('/panel/parroquias/a/rotar', { method: 'POST', cookie }));
    expect(await rot.text()).toContain('La anterior ya no funciona');
    expect((await prisma.instancia.findUniqueOrThrow({ where: { codigo: 'a' } })).secreto_cifrado).not.toBe(antes);
  });

  it('POST desde otro sitio -> 403 (anti-CSRF)', async () => {
    const cookie = await login();
    const r = await enrutar(
      req('/panel/parroquias', { ...form({ codigo: 'x', nombre: 'X', url: 'https://x.test' }), cookie, origen: false, headers: { origin: 'https://malicioso.test', 'content-type': 'application/x-www-form-urlencoded' } })
    );
    expect(r.status).toBe(403);
    expect(await prisma.instancia.count()).toBe(0);
  });
});

describe('panel: bitácora', () => {
  it('lista consultas por nombre de parroquia y nunca muestra el hash del DNI', async () => {
    const cookie = await login();
    await prisma.instancia.createMany({
      data: [
        { codigo: 'a', nombre: 'Cristo Resucitado', url: 'https://a.test', secreto_cifrado: cifrar('1') },
        { codigo: 'b', nombre: 'Salvador del Mundo', url: 'https://b.test', secreto_cifrado: cifrar('2') },
      ],
    });
    const hash = 'a'.repeat(64);
    await prisma.solicitud.create({ data: { origen: 'a', destino: 'b', dni_hash: hash, estado: 'aprobada' } });
    const texto = await (await enrutar(req('/panel/consultas', { cookie }))).text();
    expect(texto).toContain('Cristo Resucitado');
    expect(texto).toContain('Aprobada');
    expect(texto).not.toContain(hash);

    const filtrado = await (await enrutar(req('/panel/consultas?estado=pendiente', { cookie }))).text();
    expect(filtrado).toContain('No hay consultas');
  });
});
