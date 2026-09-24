import { describe, it, expect, beforeEach, afterAll, afterEach, vi } from 'vitest';
import { prisma } from '../src/prisma';
import { enrutar } from '../src/router';
import { cifrar, descifrar } from '../src/cifrado';
import { cabecerasFirmadas, verificarFirma } from '../../src/lib/interop/firma';

const SECRETOS: Record<string, string> = { a: 'secreto-a', b: 'secreto-b' };
const fetchMock = vi.fn();

function req(instancia: string, metodo: 'GET' | 'POST', ruta: string, body?: unknown, secreto?: string) {
  const cuerpo = body === undefined ? '' : JSON.stringify(body);
  return new Request(`http://hub.test${ruta}`, {
    method: metodo,
    headers: cabecerasFirmadas(secreto ?? SECRETOS[instancia], instancia, metodo, ruta, cuerpo),
    body: metodo === 'GET' ? undefined : cuerpo,
  });
}

const nueva = { destino: 'b', numero_identidad: '0801199000001', motivo: 'Matrimonio' };

beforeEach(async () => {
  vi.stubGlobal('fetch', fetchMock);
  await prisma.solicitud.deleteMany({});
  await prisma.instancia.deleteMany({});
  await prisma.instancia.createMany({
    data: [
      { codigo: 'a', nombre: 'Cristo Resucitado', url: 'http://a.test', secreto_cifrado: cifrar(SECRETOS.a) },
      { codigo: 'b', nombre: 'Salvador del Mundo', url: 'http://b.test', secreto_cifrado: cifrar(SECRETOS.b) },
    ],
  });
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

afterAll(async () => {
  await prisma.solicitud.deleteMany({});
  await prisma.instancia.deleteMany({});
  await prisma.$disconnect();
});

describe('cifrado', () => {
  it('ida y vuelta, con IV distinto cada vez', () => {
    const c1 = cifrar('x');
    expect(descifrar(c1)).toBe('x');
    expect(cifrar('x')).not.toBe(c1);
  });
});

describe('GET /api/instancias', () => {
  it('sin firma válida -> 401', async () => {
    const res = await enrutar(req('a', 'GET', '/api/instancias', undefined, 'otro'));
    expect(res.status).toBe(401);
  });

  it('lista las instancias activas', async () => {
    await prisma.instancia.update({ where: { codigo: 'b' }, data: { activa: false } });
    const res = await enrutar(req('a', 'GET', '/api/instancias'));
    expect(await res.json()).toEqual([{ codigo: 'a', nombre: 'Cristo Resucitado' }]);
  });
});

describe('POST /api/solicitudes', () => {
  it('entrega al destino firmado por el hub y no guarda el DNI en claro', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 201 }));
    const res = await enrutar(req('a', 'POST', '/api/solicitudes', nueva));
    expect(res.status).toBe(201);
    const { uuid, destino_nombre } = await res.json();
    expect(destino_nombre).toBe('Salvador del Mundo');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://b.test/api/interop/entrantes');
    expect(init.headers['x-interop-instancia']).toBe('hub');
    const verif = verificarFirma(SECRETOS.b, {
      timestamp: init.headers['x-interop-timestamp'],
      firma: init.headers['x-interop-firma'],
      metodo: 'POST',
      ruta: '/api/interop/entrantes',
      cuerpo: init.body,
    });
    expect(verif.ok).toBe(true);
    expect(JSON.parse(init.body)).toMatchObject({ uuid, origen: 'a', origen_nombre: 'Cristo Resucitado' });

    const fila = await prisma.solicitud.findUniqueOrThrow({ where: { uuid } });
    expect(fila.dni_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(fila)).not.toContain(nueva.numero_identidad);
  });

  it('destino caído -> 502 y error_entrega', async () => {
    fetchMock.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await enrutar(req('a', 'POST', '/api/solicitudes', nueva));
    expect(res.status).toBe(502);
    expect((await prisma.solicitud.findFirstOrThrow()).estado).toBe('error_entrega');
  });

  it('destino desconocido -> 404; origen inactivo -> 401', async () => {
    expect((await enrutar(req('a', 'POST', '/api/solicitudes', { ...nueva, destino: 'zz' }))).status).toBe(404);
    await prisma.instancia.update({ where: { codigo: 'a' }, data: { activa: false } });
    expect((await enrutar(req('a', 'POST', '/api/solicitudes', nueva))).status).toBe(401);
  });
});

describe('POST /api/solicitudes/:uuid/respuesta', () => {
  async function solicitudPendiente() {
    const s = await prisma.solicitud.create({ data: { origen: 'a', destino: 'b', dni_hash: 'f'.repeat(64) } });
    return s.uuid;
  }
  const aprobada = { estado: 'aprobada', respuesta: { encontrado: false } };

  it('solo la parroquia destino puede responder', async () => {
    const uuid = await solicitudPendiente();
    const res = await enrutar(req('a', 'POST', `/api/solicitudes/${uuid}/respuesta`, aprobada));
    expect(res.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reenvía al origen, marca el estado y no admite doble respuesta', async () => {
    const uuid = await solicitudPendiente();
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    const res = await enrutar(req('b', 'POST', `/api/solicitudes/${uuid}/respuesta`, aprobada));
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://a.test/api/interop/respuestas');
    expect(JSON.parse(init.body)).toEqual({ uuid, ...aprobada });
    expect((await prisma.solicitud.findUniqueOrThrow({ where: { uuid } })).estado).toBe('aprobada');

    const otra = await enrutar(req('b', 'POST', `/api/solicitudes/${uuid}/respuesta`, aprobada));
    expect(otra.status).toBe(409);
  });

  it('origen caído -> 502 y sigue pendiente para reintentar', async () => {
    const uuid = await solicitudPendiente();
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 503 }));
    const res = await enrutar(req('b', 'POST', `/api/solicitudes/${uuid}/respuesta`, aprobada));
    expect(res.status).toBe(502);
    expect((await prisma.solicitud.findUniqueOrThrow({ where: { uuid } })).estado).toBe('pendiente');
  });

  it('rechazo sin motivo -> 400', async () => {
    const uuid = await solicitudPendiente();
    const res = await enrutar(req('b', 'POST', `/api/solicitudes/${uuid}/respuesta`, { estado: 'rechazada' }));
    expect(res.status).toBe(400);
  });
});
