import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as listSectores, POST as createSector } from '@/app/api/configuracion/sectores/route';
import {
  PUT as updateSector,
  DELETE as deleteSector,
} from '@/app/api/configuracion/sectores/[id]/route';

let parishA: number;
let parishB: number;
let tipoId: number;

const DEP = '08';
const MUN = '0801';

function setSession(parishId: number | null, rol = 'administrador') {
  if (parishId === null) {
    mockGetServerSession.mockResolvedValue(null);
  } else {
    mockGetServerSession.mockResolvedValue({
      user: { id: '1', parishId: String(parishId), rol },
    });
  }
}

function getReq(): NextRequest {
  return new Request('http://test.local/api/configuracion/sectores') as unknown as NextRequest;
}
void getReq;

function postReq(body: unknown): NextRequest {
  return new Request('http://test.local/api/configuracion/sectores', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function putReq(body: unknown): NextRequest {
  return new Request('http://test.local/api/configuracion/sectores/1', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function deleteReq(): NextRequest {
  return new Request('http://test.local/api/configuracion/sectores/1', { method: 'DELETE' }) as unknown as NextRequest;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function seedPersona(parishId: number, dni: string, sectorId: bigint) {
  await prisma.persona.create({
    data: {
      numero_identidad: dni,
      id_parroquia: parishId,
      id_sector_parroquial: sectorId,
      nombres: 'A',
      apellidos: 'B',
      fecha_nacimiento: new Date('1990-01-01'),
      lugar_nacimiento: MUN,
      sexo: 'M',
      telefono: '99999999',
      estado_vital: 1,
      estado_activo_parroquia: 1,
    },
  });
}

beforeAll(async () => {
  await prisma.departamento.upsert({
    where: { codigo_departamento: DEP }, update: {},
    create: { codigo_departamento: DEP, nombre_departamento: 'X' },
  });
  await prisma.municipio.upsert({
    where: { codigo_municipio: MUN }, update: {},
    create: { codigo_municipio: MUN, codigo_departamento: DEP, nombre_municipio: 'Y' },
  });
  const tipo = await prisma.tipoSectorParroquial.create({ data: { nombre: 'Zona' } });
  tipoId = tipo.id_tipo_sector_parroquial;
  const pA = await prisma.parroquia.create({ data: { nombre: 'A', ubicacion: MUN, direccion: 'x', telefono: '1' } });
  const pB = await prisma.parroquia.create({ data: { nombre: 'B', ubicacion: MUN, direccion: 'y', telefono: '2' } });
  parishA = pA.id_parroquia;
  parishB = pB.id_parroquia;
});

afterEach(async () => {
  await prisma.bitacoraCrud.deleteMany({});
  await prisma.persona.deleteMany({});
  await prisma.sectorParroquial.deleteMany({});
  vi.clearAllMocks();
});

afterAll(async () => {
  await prisma.bitacoraCrud.deleteMany({});
  await prisma.sectorParroquial.deleteMany({});
  await prisma.persona.deleteMany({});
  await prisma.parroquiaConfig.deleteMany({});
  await prisma.parroquia.deleteMany({});
  await prisma.tipoSectorParroquial.deleteMany({});
  await prisma.municipio.deleteMany({});
  await prisma.departamento.deleteMany({});
  await prisma.$disconnect();
});

describe('GET /api/configuracion/sectores', () => {
  it('sin sesión -> 401', async () => {
    setSession(null);
    expect((await listSectores()).status).toBe(401);
  });

  it('solo lista sectores de la parroquia de sesión', async () => {
    const sA = await prisma.sectorParroquial.create({
      data: { id_parroquia: parishA, id_tipo_sector_parroquial: tipoId, nombre: 'SA', direccion: 'x' },
    });
    const sB = await prisma.sectorParroquial.create({
      data: { id_parroquia: parishB, id_tipo_sector_parroquial: tipoId, nombre: 'SB', direccion: 'y' },
    });
    setSession(parishA);
    const res = await listSectores();
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].id_sector_parroquial).toBe(sA.id_sector_parroquial.toString());
    expect(json.find((x: { id_sector_parroquial: string }) => x.id_sector_parroquial === sB.id_sector_parroquial.toString())).toBeUndefined();
  });

  it('sin permiso -> 403', async () => {
    setSession(parishA, 'guest');
    expect((await listSectores()).status).toBe(403);
  });
});

describe('POST /api/configuracion/sectores', () => {
  it('crea sector válido -> 201 y bitácora', async () => {
    setSession(parishA);
    const res = await createSector(postReq({
      id_tipo_sector_parroquial: tipoId,
      nombre: 'Centro',
      direccion: 'Calle 1',
    }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.nombre).toBe('Centro');
    const bitacora = await prisma.bitacoraCrud.findMany({
      where: { nombre_tabla: 'sector_parroquial', accion: 'C', id_parroquia: parishA },
    });
    expect(bitacora.length).toBe(1);
  });

  it('nombre_capilla opcional', async () => {
    setSession(parishA);
    const res = await createSector(postReq({
      id_tipo_sector_parroquial: tipoId,
      nombre: 'Centro',
      nombre_capilla: 'Capilla San José',
      direccion: 'Calle 1',
    }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.nombre_capilla).toBe('Capilla San José');
  });

  it('sin nombre -> 400', async () => {
    setSession(parishA);
    const res = await createSector(postReq({
      id_tipo_sector_parroquial: tipoId,
      nombre: '',
      direccion: 'Calle 1',
    }));
    expect(res.status).toBe(400);
  });

  it('sin dirección -> 400', async () => {
    setSession(parishA);
    const res = await createSector(postReq({
      id_tipo_sector_parroquial: tipoId,
      nombre: 'X',
      direccion: '',
    }));
    expect(res.status).toBe(400);
  });

  it('sin tipo de sector -> 400', async () => {
    setSession(parishA);
    const res = await createSector(postReq({
      nombre: 'X',
      direccion: 'y',
    }));
    expect(res.status).toBe(400);
  });

  it('tipo inexistente -> 400', async () => {
    setSession(parishA);
    const res = await createSector(postReq({
      id_tipo_sector_parroquial: 9999,
      nombre: 'X',
      direccion: 'y',
    }));
    expect(res.status).toBe(400);
  });

  it('rol secretaria -> 403', async () => {
    setSession(parishA, 'secretario');
    const res = await createSector(postReq({
      id_tipo_sector_parroquial: tipoId,
      nombre: 'X',
      direccion: 'y',
    }));
    expect(res.status).toBe(403);
  });

  it('un nuevo sector aparece para formularios de persona', async () => {
    setSession(parishA);
    await createSector(postReq({
      id_tipo_sector_parroquial: tipoId,
      nombre: 'Norte',
      direccion: 'Calle N',
    }));
    const listado = await prisma.sectorParroquial.findMany({
      where: { id_parroquia: parishA },
      orderBy: { nombre: 'asc' },
    });
    expect(listado.find((s) => s.nombre === 'Norte')).toBeTruthy();
  });
});

describe('PUT /api/configuracion/sectores/[id]', () => {
  it('edita propio -> 200 + auditoría', async () => {
    const s = await prisma.sectorParroquial.create({
      data: { id_parroquia: parishA, id_tipo_sector_parroquial: tipoId, nombre: 'SA', direccion: 'x' },
    });
    setSession(parishA);
    const res = await updateSector(putReq({ nombre: 'SA-2', direccion: 'x2' }), ctx(s.id_sector_parroquial.toString()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.nombre).toBe('SA-2');
    const bitacora = await prisma.bitacoraCrud.findMany({
      where: { nombre_tabla: 'sector_parroquial', accion: 'U', id_parroquia: parishA },
    });
    expect(bitacora.length).toBe(1);
  });

  it('cross-tenant -> 404', async () => {
    const sA = await prisma.sectorParroquial.create({
      data: { id_parroquia: parishA, id_tipo_sector_parroquial: tipoId, nombre: 'SA', direccion: 'x' },
    });
    setSession(parishB);
    const res = await updateSector(putReq({ nombre: 'HACK' }), ctx(sA.id_sector_parroquial.toString()));
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/configuracion/sectores/[id]', () => {
  it('sin personas -> 200 + auditoría D', async () => {
    const s = await prisma.sectorParroquial.create({
      data: { id_parroquia: parishA, id_tipo_sector_parroquial: tipoId, nombre: 'SA', direccion: 'x' },
    });
    setSession(parishA);
    const res = await deleteSector(deleteReq(), ctx(s.id_sector_parroquial.toString()));
    expect(res.status).toBe(200);
    const restantes = await prisma.sectorParroquial.findMany({ where: { id_parroquia: parishA } });
    expect(restantes).toHaveLength(0);
    const bitacora = await prisma.bitacoraCrud.findMany({
      where: { nombre_tabla: 'sector_parroquial', accion: 'D', id_parroquia: parishA },
    });
    expect(bitacora.length).toBe(1);
  });

  it('con personas -> 409', async () => {
    const s = await prisma.sectorParroquial.create({
      data: { id_parroquia: parishA, id_tipo_sector_parroquial: tipoId, nombre: 'SA', direccion: 'x' },
    });
    await seedPersona(parishA, 'P0001', s.id_sector_parroquial);
    setSession(parishA);
    const res = await deleteSector(deleteReq(), ctx(s.id_sector_parroquial.toString()));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error.toLowerCase()).toMatch(/persona/i);
    const restantes = await prisma.sectorParroquial.findMany({ where: { id_sector_parroquial: s.id_sector_parroquial } });
    expect(restantes).toHaveLength(1);
  });

  it('cross-tenant -> 404', async () => {
    const sA = await prisma.sectorParroquial.create({
      data: { id_parroquia: parishA, id_tipo_sector_parroquial: tipoId, nombre: 'SA', direccion: 'x' },
    });
    setSession(parishB);
    const res = await deleteSector(deleteReq(), ctx(sA.id_sector_parroquial.toString()));
    expect(res.status).toBe(404);
  });
});