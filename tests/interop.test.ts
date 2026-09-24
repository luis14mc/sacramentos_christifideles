import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as listar, POST as crear } from '@/app/api/interop/solicitudes/route';
import { POST as resolver } from '@/app/api/interop/solicitudes/[id]/resolver/route';
import { POST as entrantes } from '@/app/api/interop/entrantes/route';
import { POST as respuestas } from '@/app/api/interop/respuestas/route';
import { cabecerasFirmadas } from '@/lib/interop/firma';
import { EMISOR_HUB } from '@/lib/interop/contrato';
import { setupCatalogo, seedPersona, limpiarCatalogo, type Catalogo } from './helpers/sacramentos-fixtures';

const SECRETO = 'secreto-test-interop';
const UUID = '3f1c2a4e-5b6d-4e7f-8a9b-0c1d2e3f4a5b';
let cat: Catalogo;
const fetchMock = vi.fn();

function setSession(parishId: number, rol = 'administrador') {
  mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: String(parishId), rol } });
}

function jsonReq(path: string, body: unknown): NextRequest {
  return new Request(`http://test.local${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

/** Petición firmada como si viniera del hub. */
function hubReq(path: string, body: unknown, secreto = SECRETO): NextRequest {
  const cuerpo = JSON.stringify(body);
  return new Request(`http://test.local${path}`, {
    method: 'POST',
    headers: cabecerasFirmadas(secreto, EMISOR_HUB, 'POST', path, cuerpo),
    body: cuerpo,
  }) as unknown as NextRequest;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function hubResponde(status: number, body: unknown = {}) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
}

beforeAll(async () => {
  await limpiarCatalogo();
  cat = await setupCatalogo();
});

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('INTEROP_HUB_URL', 'http://hub.test');
  vi.stubEnv('INTEROP_SECRET', SECRETO);
  vi.stubEnv('PARROQUIA_CODIGO', 'cristo-resucitado');
});

afterEach(async () => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  await prisma.solicitudInterop.deleteMany({});
});

afterAll(async () => {
  await limpiarCatalogo();
  await prisma.$disconnect();
});

describe('POST /api/interop/solicitudes', () => {
  const body = { destino: 'salvador-del-mundo', numero_identidad: '0801199000001', motivo: 'Matrimonio' };

  it('sin configuración de interop -> 503', async () => {
    vi.stubEnv('INTEROP_SECRET', '');
    setSession(cat.parishA);
    const res = await crear(jsonReq('/api/interop/solicitudes', body));
    expect(res.status).toBe(503);
  });

  it('catequista no puede consultar -> 403', async () => {
    setSession(cat.parishA, 'catequista');
    const res = await crear(jsonReq('/api/interop/solicitudes', body));
    expect(res.status).toBe(403);
  });

  it('no permite consultarse a sí misma -> 400', async () => {
    setSession(cat.parishA);
    const res = await crear(jsonReq('/api/interop/solicitudes', { ...body, destino: 'cristo-resucitado' }));
    expect(res.status).toBe(400);
  });

  it('envía al hub firmado y guarda el uuid -> 201', async () => {
    setSession(cat.parishA);
    hubResponde(201, { uuid: UUID, destino_nombre: 'Salvador del Mundo' });
    const res = await crear(jsonReq('/api/interop/solicitudes', body));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json).toMatchObject({ uuid: UUID, direccion: 'S', estado: 'pendiente' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://hub.test/api/solicitudes');
    expect(init.headers['x-interop-instancia']).toBe('cristo-resucitado');
    expect(init.headers['x-interop-firma']).toMatch(/^[0-9a-f]{64}$/);

    const bitacora = await prisma.bitacoraCrud.findFirst({ where: { nombre_tabla: 'solicitud_interop' } });
    expect(bitacora?.accion).toBe('C');
  });

  it('hub caído -> 502 y estado error_envio', async () => {
    setSession(cat.parishA);
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await crear(jsonReq('/api/interop/solicitudes', body));
    expect(res.status).toBe(502);
    const fila = await prisma.solicitudInterop.findFirst();
    expect(fila?.estado).toBe('error_envio');
  });
});

describe('POST /api/interop/entrantes (desde el hub)', () => {
  const entrante = {
    uuid: UUID,
    origen: 'salvador-del-mundo',
    origen_nombre: 'Salvador del Mundo',
    numero_identidad: '0801199000002',
    motivo: 'Confirmación',
  };

  it('rechaza peticiones sin firma válida -> 401', async () => {
    const res = await entrantes(hubReq('/api/interop/entrantes', entrante, 'secreto-falso'));
    expect(res.status).toBe(401);
    expect(await prisma.solicitudInterop.count()).toBe(0);
  });

  it('registra la entrante pendiente y es idempotente', async () => {
    expect((await entrantes(hubReq('/api/interop/entrantes', entrante))).status).toBe(201);
    expect((await entrantes(hubReq('/api/interop/entrantes', entrante))).status).toBe(201);
    const filas = await prisma.solicitudInterop.findMany();
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ direccion: 'E', estado: 'pendiente', uuid: UUID });
  });
});

describe('POST /api/interop/solicitudes/[id]/resolver', () => {
  async function crearEntrante(parishId: number, dni: string) {
    return prisma.solicitudInterop.create({
      data: {
        id_parroquia: parishId,
        uuid: UUID,
        direccion: 'E',
        codigo_parroquia_contraparte: 'salvador-del-mundo',
        numero_identidad_consultado: dni,
        motivo: 'Matrimonio',
      },
    });
  }

  it('secretario no puede resolver -> 403', async () => {
    const s = await crearEntrante(cat.parishA, 'X1');
    setSession(cat.parishA, 'secretario');
    const res = await resolver(jsonReq('/r', { accion: 'aprobar' }), ctx(s.id_solicitud.toString()));
    expect(res.status).toBe(403);
  });

  it('otra parroquia no ve la solicitud -> 404', async () => {
    const s = await crearEntrante(cat.parishA, 'X2');
    setSession(cat.parishB);
    const res = await resolver(jsonReq('/r', { accion: 'aprobar' }), ctx(s.id_solicitud.toString()));
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aprobar envía solo datos mínimos y marca aprobada', async () => {
    await seedPersona(cat.parishA, 'INTEROP-1', cat.sectorA, cat.ordenId);
    const s = await crearEntrante(cat.parishA, 'INTEROP-1');
    setSession(cat.parishA);
    hubResponde(200, { reenviada: true });

    const res = await resolver(jsonReq('/r', { accion: 'aprobar' }), ctx(s.id_solicitud.toString()));
    expect(res.status).toBe(200);
    expect((await res.json()).estado).toBe('aprobada');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`http://hub.test/api/solicitudes/${UUID}/respuesta`);
    const enviado = JSON.parse(init.body);
    expect(enviado.estado).toBe('aprobada');
    expect(enviado.respuesta).toMatchObject({ encontrado: true, nombres: 'NINTEROP-1', sacramentos: [] });
    expect(init.body).not.toContain('55555555'); // teléfono nunca se comparte

    const fila = await prisma.solicitudInterop.findUnique({ where: { id_solicitud: s.id_solicitud } });
    expect(fila?.respuesta).toBeNull(); // la instancia que responde no guarda los datos
  });

  it('si el hub falla la solicitud sigue pendiente -> 502', async () => {
    const s = await crearEntrante(cat.parishA, 'X3');
    setSession(cat.parishA);
    hubResponde(500);
    const res = await resolver(jsonReq('/r', { accion: 'aprobar' }), ctx(s.id_solicitud.toString()));
    expect(res.status).toBe(502);
    const fila = await prisma.solicitudInterop.findUnique({ where: { id_solicitud: s.id_solicitud } });
    expect(fila?.estado).toBe('pendiente');
  });

  it('rechazar exige motivo', async () => {
    const s = await crearEntrante(cat.parishA, 'X4');
    setSession(cat.parishA);
    const res = await resolver(jsonReq('/r', { accion: 'rechazar' }), ctx(s.id_solicitud.toString()));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/interop/respuestas (desde el hub)', () => {
  it('guarda la respuesta en la saliente y es idempotente', async () => {
    await prisma.solicitudInterop.create({
      data: {
        id_parroquia: cat.parishA,
        uuid: UUID,
        direccion: 'S',
        codigo_parroquia_contraparte: 'salvador-del-mundo',
        numero_identidad_consultado: 'Y1',
        motivo: 'Matrimonio',
      },
    });
    const body = { uuid: UUID, estado: 'aprobada', respuesta: { encontrado: false } };
    expect((await respuestas(hubReq('/api/interop/respuestas', body))).status).toBe(200);
    expect((await respuestas(hubReq('/api/interop/respuestas', body))).status).toBe(200);

    const conflicto = await respuestas(
      hubReq('/api/interop/respuestas', { uuid: UUID, estado: 'rechazada', motivo_rechazo: 'x' })
    );
    expect(conflicto.status).toBe(409);

    setSession(cat.parishA);
    const bandeja = await listar(new Request('http://test.local/api/interop/solicitudes?direccion=S') as unknown as NextRequest);
    const [fila] = await bandeja.json();
    expect(fila).toMatchObject({ estado: 'aprobada', respuesta: { encontrado: false } });
  });
});
