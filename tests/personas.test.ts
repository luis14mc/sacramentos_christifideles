import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

// --- Mock de sesión: getServerSession se controla por test ---
const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as listPersonas, POST as createPersona } from '@/app/api/personas/route';
import {
  GET as getPersona,
  PUT as updatePersona,
  DELETE as deletePersona,
} from '@/app/api/personas/[id]/route';

// --- Fixtures compartidos ---
let parishA: number;
let parishB: number;
let sectorA: bigint;
let sectorB: bigint;
let ordenId: number;
let grupoId: number;
let rolId: number;

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

function makeReq(body: unknown): NextRequest {
  return new Request('http://test.local/api/personas', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function listReq(query = ''): NextRequest {
  return new Request(`http://test.local/api/personas${query}`) as unknown as NextRequest;
}

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function validBody(dni: string, sectorId: bigint, overrides: Record<string, unknown> = {}) {
  return {
    numero_identidad: dni,
    nombres: 'Juan',
    apellidos: 'Pérez',
    fecha_nacimiento: '1990-05-20',
    sexo: 'M',
    telefono: '99998888',
    sector_id: sectorId.toString(),
    municipio_id: MUN,
    id_orden_religiosa: ordenId,
    ...overrides,
  };
}

async function seedPersona(parishId: number, dni: string, sectorId: bigint) {
  await prisma.persona.create({
    data: {
      numero_identidad: dni,
      id_parroquia: parishId,
      id_sector_parroquial: sectorId,
      id_orden_religiosa: ordenId,
      nombres: 'Ana',
      apellidos: 'López',
      fecha_nacimiento: new Date('1985-01-01'),
      lugar_nacimiento: MUN,
      sexo: 'F',
      telefono: '77776666',
      estado_vital: 1,
      estado_activo_parroquia: 1,
    },
  });
}

beforeAll(async () => {
  await prisma.departamento.upsert({
    where: { codigo_departamento: DEP },
    update: {},
    create: { codigo_departamento: DEP, nombre_departamento: 'Francisco Morazán' },
  });
  await prisma.municipio.upsert({
    where: { codigo_municipio: MUN },
    update: {},
    create: { codigo_municipio: MUN, codigo_departamento: DEP, nombre_municipio: 'Distrito Central' },
  });
  const tipo = await prisma.tipoSectorParroquial.create({ data: { nombre: 'Zona' } });
  const orden = await prisma.ordenReligiosa.create({ data: { nombre: 'Clero Secular', rama: 'N' } });
  ordenId = orden.id_orden_religiosa;

  const pA = await prisma.parroquia.create({
    data: { nombre: 'Parroquia A', ubicacion: MUN, direccion: 'Calle A', telefono: '2200' },
  });
  const pB = await prisma.parroquia.create({
    data: { nombre: 'Parroquia B', ubicacion: MUN, direccion: 'Calle B', telefono: '2201' },
  });
  parishA = pA.id_parroquia;
  parishB = pB.id_parroquia;

  const sA = await prisma.sectorParroquial.create({
    data: { id_parroquia: parishA, id_tipo_sector_parroquial: tipo.id_tipo_sector_parroquial, nombre: 'Sector A', direccion: 'x' },
  });
  const sB = await prisma.sectorParroquial.create({
    data: { id_parroquia: parishB, id_tipo_sector_parroquial: tipo.id_tipo_sector_parroquial, nombre: 'Sector B', direccion: 'y' },
  });
  sectorA = sA.id_sector_parroquial;
  sectorB = sB.id_sector_parroquial;

  const grupo = await prisma.grupoParroquial.create({ data: { nombre: 'Coro' } });
  const rol = await prisma.rolParroquial.create({ data: { nombre: 'Integrante' } });
  grupoId = grupo.id_grupo_parroquial;
  rolId = rol.id_rol_parroquial;
});

afterEach(async () => {
  await prisma.trPersonaGrupoRol.deleteMany({});
  await prisma.persona.deleteMany({});
  vi.clearAllMocks();
});

afterAll(async () => {
  await prisma.trPersonaGrupoRol.deleteMany({});
  await prisma.persona.deleteMany({});
  await prisma.sectorParroquial.deleteMany({});
  await prisma.grupoParroquial.deleteMany({});
  await prisma.rolParroquial.deleteMany({});
  await prisma.parroquia.deleteMany({});
  await prisma.ordenReligiosa.deleteMany({});
  await prisma.tipoSectorParroquial.deleteMany({});
  await prisma.municipio.deleteMany({});
  await prisma.departamento.deleteMany({});
  await prisma.$disconnect();
});

describe('CREATE /api/personas', () => {
  it('crea una Persona válida -> 201', async () => {
    setSession(parishA);
    const res = await createPersona(makeReq(validBody('A1001', sectorA)));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.numero_identidad).toBe('A1001');
    expect(json.id_parroquia).toBe(parishA);
  });

  it('rechaza Persona sin DNI -> 400', async () => {
    setSession(parishA);
    const res = await createPersona(makeReq(validBody('', sectorA, { numero_identidad: '' })));
    expect(res.status).toBe(400);
  });

  it('rechaza Persona sin orden religiosa explícita -> 400', async () => {
    setSession(parishA);
    const res = await createPersona(makeReq(validBody('A1005', sectorA, { id_orden_religiosa: '' })));
    expect(res.status).toBe(400);
  });

  it('rechaza DNI duplicado en la misma parroquia -> 409', async () => {
    setSession(parishA);
    await seedPersona(parishA, 'A1002', sectorA);
    const res = await createPersona(makeReq(validBody('A1002', sectorA)));
    expect(res.status).toBe(409);
  });

  it('rechaza sector de otra parroquia -> 403', async () => {
    setSession(parishA);
    const res = await createPersona(makeReq(validBody('A1003', sectorB)));
    expect(res.status).toBe(403);
  });

  it('sin sesión -> 401', async () => {
    setSession(null);
    const res = await createPersona(makeReq(validBody('A1004', sectorA)));
    expect(res.status).toBe(401);
  });
});

describe('GET /api/personas', () => {
  it('búsqueda lite respeta tenant y límite', async () => {
    await seedPersona(parishA, 'SEARCH-A', sectorA);
    await seedPersona(parishB, 'SEARCH-B', sectorB);
    setSession(parishA);
    const res = await listPersonas(listReq('?q=SEARCH&limit=10&lite=1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveLength(1);
    expect(json[0].numero_identidad).toBe('SEARCH-A');
  });
});

describe('GET /api/personas/[id]', () => {
  it('obtiene una Persona propia -> 200', async () => {
    await seedPersona(parishA, 'A2001', sectorA);
    setSession(parishA);
    const res = await getPersona({} as NextRequest, ctx('A2001'));
    expect(res.status).toBe(200);
  });

  it('cross-tenant se comporta como 404 (no 403)', async () => {
    await seedPersona(parishA, 'A2002', sectorA);
    setSession(parishB);
    const res = await getPersona({} as NextRequest, ctx('A2002'));
    expect(res.status).toBe(404);
  });
});

describe('UPDATE /api/personas/[id]', () => {
  it('actualiza una Persona propia -> 200', async () => {
    await seedPersona(parishA, 'A3001', sectorA);
    setSession(parishA);
    const res = await updatePersona(makeReq({ nombres: 'Nuevo' }), ctx('A3001'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.nombres).toBe('Nuevo');
  });

  it('cross-tenant -> 404', async () => {
    await seedPersona(parishA, 'A3002', sectorA);
    setSession(parishB);
    const res = await updatePersona(makeReq({ nombres: 'X' }), ctx('A3002'));
    expect(res.status).toBe(404);
  });

  it('rechaza cambiar el DNI -> 400', async () => {
    await seedPersona(parishA, 'A3003', sectorA);
    setSession(parishA);
    const res = await updatePersona(makeReq({ numero_identidad: 'OTRO' }), ctx('A3003'));
    expect(res.status).toBe(400);
  });

  it('rechaza nombres vacíos -> 400', async () => {
    await seedPersona(parishA, 'A3004', sectorA);
    setSession(parishA);
    const res = await updatePersona(makeReq({ nombres: '   ' }), ctx('A3004'));
    expect(res.status).toBe(400);
  });

  it('rechaza apellidos vacíos -> 400', async () => {
    await seedPersona(parishA, 'A3005', sectorA);
    setSession(parishA);
    const res = await updatePersona(makeReq({ apellidos: '' }), ctx('A3005'));
    expect(res.status).toBe(400);
  });

  it('rechaza teléfono vacío -> 400', async () => {
    await seedPersona(parishA, 'A3006', sectorA);
    setSession(parishA);
    const res = await updatePersona(makeReq({ telefono: '   ' }), ctx('A3006'));
    expect(res.status).toBe(400);
  });

  it('rechaza fecha de nacimiento inválida -> 400', async () => {
    await seedPersona(parishA, 'A3007', sectorA);
    setSession(parishA);
    const res = await updatePersona(makeReq({ fecha_nacimiento: 'fecha-invalida' }), ctx('A3007'));
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/personas/[id]', () => {
  it('con historia (grupo) -> 409', async () => {
    await seedPersona(parishA, 'A4001', sectorA);
    await prisma.trPersonaGrupoRol.create({
      data: {
        numero_identidad: 'A4001',
        id_parroquia: parishA,
        id_grupo_parroquial: grupoId,
        id_rol_parroquial: rolId,
      },
    });
    setSession(parishA);
    const res = await deletePersona({} as NextRequest, ctx('A4001'));
    expect(res.status).toBe(409);
  });

  it('sin historia -> 200', async () => {
    await seedPersona(parishA, 'A4002', sectorA);
    setSession(parishA);
    const res = await deletePersona({} as NextRequest, ctx('A4002'));
    expect(res.status).toBe(200);
  });

  it('cross-tenant -> 404', async () => {
    await seedPersona(parishA, 'A4003', sectorA);
    setSession(parishB);
    const res = await deletePersona({} as NextRequest, ctx('A4003'));
    expect(res.status).toBe(404);
  });
});

describe('RBAC', () => {
  it('solo lectura puede ver (GET list) -> 200', async () => {
    setSession(parishA, 'solo lectura');
    const res = await listPersonas(listReq());
    expect(res.status).toBe(200);
  });

  it('solo lectura NO puede crear -> 403', async () => {
    setSession(parishA, 'solo lectura');
    const res = await createPersona(makeReq(validBody('A5001', sectorA)));
    expect(res.status).toBe(403);
  });

  it('solo lectura NO puede editar -> 403', async () => {
    await seedPersona(parishA, 'A5003', sectorA);
    setSession(parishA, 'solo lectura');
    const res = await updatePersona(makeReq({ nombres: 'No permitido' }), ctx('A5003'));
    expect(res.status).toBe(403);
  });

  it('solo lectura NO puede eliminar -> 403', async () => {
    await seedPersona(parishA, 'A5004', sectorA);
    setSession(parishA, 'solo lectura');
    const res = await deletePersona({} as NextRequest, ctx('A5004'));
    expect(res.status).toBe(403);
  });

  it('administrador puede crear -> 201', async () => {
    setSession(parishA, 'administrador');
    const res = await createPersona(makeReq(validBody('A5002', sectorA)));
    expect(res.status).toBe(201);
  });
});
