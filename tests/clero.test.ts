import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as listClero, POST as createClero } from '@/app/api/sacerdotes/route';
import { GET as getClero, PUT as updateClero } from '@/app/api/sacerdotes/[dni]/route';
import { GET as listPersonas } from '@/app/api/personas/route';
import { POST as createBautismo } from '@/app/api/bautismos/route';
import { POST as createComunion } from '@/app/api/primeras-comuniones/route';
import { POST as createConfirmacion } from '@/app/api/confirmaciones/route';
import { POST as createMatrimonio } from '@/app/api/matrimonios/route';
import { setupCatalogo, seedPersona, seedSacerdote, limpiarCatalogo, type Catalogo } from './helpers/sacramentos-fixtures';

let cat: Catalogo;
let rangoObispoId: number;

const MALE = 'CL-M1';
const FEMALE = 'CL-F1';
const SAME = 'CL-SAME';
const INACT = 'CL-INAC';
const DEAD = 'CL-DEAD';
const OBISPO = 'CL-OBI';
const ACTIVE = 'CL-ACT';
const BONLY = 'CL-BONLY';
const SEED_LIKE_MEN = [
  ['CL-QA-A', 'Juan Carlos', 'Martínez', '1990-05-18'],
  ['CL-QA-B', 'José Antonio', 'López', '1985-09-12'],
  ['CL-QA-C', 'Miguel Ángel', 'Rodríguez', '1970-03-24'],
  ['CL-QA-F', 'Carlos', 'Mejía', '1995-01-29'],
] as const;
const P = {
  bautizado: 'CL-BZ',
  madre: 'CL-MD',
  padre: 'CL-PD',
  madrina: 'CL-MN',
  padrino: 'CL-PN',
  catequista: 'CL-CT',
  comunion: 'CL-CM',
  confirmado: 'CL-CF',
  esposa: 'CL-ESF',
  esposo: 'CL-ESM',
};

function setSession(parishId: number | null, rol = 'administrador') {
  if (parishId === null) mockGetServerSession.mockResolvedValue(null);
  else mockGetServerSession.mockResolvedValue({ user: { id: '1', parishId: String(parishId), rol } });
}

function req(body: unknown, url = 'http://t/api/sacerdotes', method = 'POST'): NextRequest {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(body),
  }) as unknown as NextRequest;
}

function getReq(url: string): NextRequest {
  return new Request(url) as unknown as NextRequest;
}

function ctx(dni: string) {
  return { params: Promise.resolve({ dni }) };
}

function cleroBody(dni: string, overrides: Record<string, unknown> = {}) {
  return {
    numero_identidad: dni,
    id_rango_sacerdotal: cat.rangoId,
    id_orden_religiosa: cat.ordenId,
    es_parroco: 0,
    estado_ministerial: 1,
    ...overrides,
  };
}

beforeAll(async () => {
  cat = await setupCatalogo();
  const obispo = await prisma.rangoOrdenSacerdotal.create({ data: { nombre: 'Obispo' } });
  rangoObispoId = obispo.id_rango_sacerdotal;
  await seedPersona(cat.parishA, MALE, cat.sectorA, cat.ordenId);
  await prisma.persona.create({
    data: {
      numero_identidad: FEMALE,
      id_parroquia: cat.parishA,
      id_sector_parroquial: cat.sectorA,
      id_orden_religiosa: cat.ordenId,
      nombres: 'Ana',
      apellidos: 'Test',
      fecha_nacimiento: new Date('1990-01-01'),
      lugar_nacimiento: '0801',
      sexo: 'F',
      telefono: '55555555',
      estado_vital: 1,
      estado_activo_parroquia: 1,
    },
  });
  await seedPersona(cat.parishA, SAME, cat.sectorA, cat.ordenId);
  await seedPersona(cat.parishB, SAME, cat.sectorB, cat.ordenId);
  await seedSacerdote(cat.parishA, INACT, cat.rangoId, cat.ordenId, cat.sectorA, { estado_ministerial: 0 });
  await seedSacerdote(cat.parishA, DEAD, cat.rangoId, cat.ordenId, cat.sectorA, { estado_vital: 0 });
  await seedSacerdote(cat.parishA, OBISPO, rangoObispoId, cat.ordenId, cat.sectorA);
  await seedSacerdote(cat.parishA, ACTIVE, cat.rangoId, cat.ordenId, cat.sectorA);
  await seedSacerdote(cat.parishB, BONLY, cat.rangoId, cat.ordenId, cat.sectorB);
  for (const [dni, nombres, apellidos, fechaNacimiento] of SEED_LIKE_MEN) {
    await prisma.persona.create({
      data: {
        numero_identidad: dni,
        id_parroquia: cat.parishA,
        id_sector_parroquial: cat.sectorA,
        id_orden_religiosa: cat.ordenId,
        nombres,
        apellidos,
        fecha_nacimiento: new Date(fechaNacimiento),
        lugar_nacimiento: '0801',
        sexo: 'M',
        telefono: '9999-0000',
        direccion: 'Distrito Central',
        estado_vital: 1,
        estado_activo_parroquia: 1,
      },
    });
  }
  for (const dni of Object.values(P)) await seedPersona(cat.parishA, dni, cat.sectorA, cat.ordenId);
});

afterEach(async () => {
  await prisma.bitacoraCrud.deleteMany({});
  await prisma.bautismo.deleteMany({});
  await prisma.primeraComunion.deleteMany({});
  await prisma.confirmacion.deleteMany({});
  await prisma.matrimonio.deleteMany({});
  await prisma.ordenSacerdotal.deleteMany({
    where: { numero_identidad: { in: [MALE, SAME, ...SEED_LIKE_MEN.map(([dni]) => dni)] } },
  });
  vi.clearAllMocks();
});

afterAll(async () => {
  await prisma.bautismo.deleteMany({});
  await prisma.primeraComunion.deleteMany({});
  await prisma.confirmacion.deleteMany({});
  await prisma.matrimonio.deleteMany({});
  await prisma.bitacoraCrud.deleteMany({});
  await limpiarCatalogo();
  await prisma.$disconnect();
});

describe('API /api/sacerdotes', () => {
  it('1. crear sin sesión -> 401', async () => {
    setSession(null);
    expect((await createClero(req(cleroBody(MALE)))).status).toBe(401);
  });

  it('2. crear sin permisos -> 403', async () => {
    setSession(cat.parishA, 'catequista');
    expect((await createClero(req(cleroBody(MALE)))).status).toBe(403);
  });

  it('3. persona inexistente -> 404', async () => {
    setSession(cat.parishA);
    expect((await createClero(req(cleroBody('NOEXISTE')))).status).toBe(404);
  });

  it('4. persona de otra parroquia -> 404', async () => {
    setSession(cat.parishB);
    expect((await createClero(req(cleroBody(MALE)))).status).toBe(404);
  });

  it('5. persona sexo F -> 400', async () => {
    setSession(cat.parishA);
    expect((await createClero(req(cleroBody(FEMALE)))).status).toBe(400);
  });

  it('6. persona sexo M -> 201', async () => {
    setSession(cat.parishA);
    const res = await createClero(req(cleroBody(MALE)));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.nombres).toBe('N' + MALE);
    expect(body.estado_ministerial).toBe(1);
  });

  it('crea clero para los cuatro perfiles masculinos vivos solicitados', async () => {
    setSession(cat.parishA);
    for (const [dni, nombres, apellidos] of SEED_LIKE_MEN) {
      const res = await createClero(req(cleroBody(dni)));
      expect(res.status).toBe(201);
      expect(await res.json()).toMatchObject({ numero_identidad: dni, nombres, apellidos, sexo: 'M', estado_vital: 1 });
    }
  });

  it('7. mismo DNI clerical en parroquias distintas', async () => {
    setSession(cat.parishA);
    expect((await createClero(req(cleroBody(SAME)))).status).toBe(201);
    setSession(cat.parishB);
    expect((await createClero(req(cleroBody(SAME)))).status).toBe(201);
  });

  it('8. usuario A no ve clero de B', async () => {
    setSession(cat.parishA);
    await createClero(req(cleroBody(MALE)));
    setSession(cat.parishB);
    expect((await getClero(getReq('http://t/api/sacerdotes/' + MALE), ctx(MALE))).status).toBe(404);
    const list = await (await listClero(getReq('http://t/api/sacerdotes'))).json();
    expect((list.data || []).some((r: { numero_identidad: string }) => r.numero_identidad === MALE)).toBe(false);
  });

  it('9. usuario A no edita clero de B', async () => {
    setSession(cat.parishA);
    await createClero(req(cleroBody(MALE)));
    setSession(cat.parishB);
    expect(
      (await updateClero(req({ estado_ministerial: 0 }, 'http://t/api/sacerdotes/' + MALE, 'PUT'), ctx(MALE))).status
    ).toBe(404);
  });

  it('10. rango inválido -> 400', async () => {
    setSession(cat.parishA);
    expect((await createClero(req(cleroBody(MALE, { id_rango_sacerdotal: 99999 })))).status).toBe(400);
  });

  it('11. orden religiosa inválida -> 400', async () => {
    setSession(cat.parishA);
    expect((await createClero(req(cleroBody(MALE, { id_orden_religiosa: 99999 })))).status).toBe(400);
  });

  it('12. duplicado misma parroquia -> 409', async () => {
    setSession(cat.parishA);
    expect((await createClero(req(cleroBody(MALE)))).status).toBe(201);
    expect((await createClero(req(cleroBody(MALE)))).status).toBe(409);
  });

  it('13. CREATE genera auditoría', async () => {
    setSession(cat.parishA);
    await createClero(req(cleroBody(MALE)));
    expect(await prisma.bitacoraCrud.count({ where: { nombre_tabla: 'orden_sacerdotal', accion: 'C', id_parroquia: cat.parishA } })).toBe(1);
  });

  it('14. UPDATE genera auditoría', async () => {
    setSession(cat.parishA);
    await createClero(req(cleroBody(MALE)));
    await updateClero(req({ estado_ministerial: 0 }, 'http://t', 'PUT'), ctx(MALE));
    expect(await prisma.bitacoraCrud.count({ where: { nombre_tabla: 'orden_sacerdotal', accion: 'U', id_parroquia: cat.parishA } })).toBe(1);
  });

  it('15. inactivar deja estado_ministerial = 0', async () => {
    setSession(cat.parishA);
    await createClero(req(cleroBody(MALE)));
    const res = await updateClero(req({ estado_ministerial: 0 }, 'http://t', 'PUT'), ctx(MALE));
    expect(res.status).toBe(200);
    expect((await res.json()).estado_ministerial).toBe(0);
  });

  it('16. inactivo no aparece en selector lite', async () => {
    setSession(cat.parishA, 'secretario');
    const lite = await (await listClero(getReq('http://t/api/sacerdotes?lite=1'))).json();
    expect(Array.isArray(lite)).toBe(true);
    expect(lite.some((r: { numero_identidad: string }) => r.numero_identidad === INACT)).toBe(false);
  });

  it('17. persona fallecida no aparece en selector lite', async () => {
    setSession(cat.parishA, 'catequista');
    const lite = await (await listClero(getReq('http://t/api/sacerdotes?lite=1'))).json();
    expect(lite.some((r: { numero_identidad: string }) => r.numero_identidad === DEAD)).toBe(false);
  });

  it('rechaza crear clero para una Persona fallecida con error claro', async () => {
    setSession(cat.parishA);
    const res = await createClero(req(cleroBody(DEAD)));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/fallecida/i);
  });

  it('conserva clero fallecido inactivo y rechaza su reactivación', async () => {
    setSession(cat.parishA);
    await prisma.ordenSacerdotal.update({
      where: { id_parroquia_numero_identidad: { id_parroquia: cat.parishA, numero_identidad: DEAD } },
      data: { estado_ministerial: 0 },
    });
    const res = await updateClero(req({ estado_ministerial: 1 }, 'http://t', 'PUT'), ctx(DEAD));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/fallecida/i);
    const historico = await prisma.ordenSacerdotal.findUniqueOrThrow({
      where: { id_parroquia_numero_identidad: { id_parroquia: cat.parishA, numero_identidad: DEAD } },
    });
    expect(historico.estado_ministerial).toBe(0);
  });

  it('PUT cambia solo datos clericales y mantiene inmutables los datos personales', async () => {
    setSession(cat.parishA);
    await createClero(req(cleroBody(MALE)));
    const res = await updateClero(
      req({ id_rango_sacerdotal: rangoObispoId, es_parroco: 1, nombres: 'Alterado', sexo: 'F' }, 'http://t', 'PUT'),
      ctx(MALE)
    );
    expect(res.status).toBe(200);
    const detail = await res.json();
    expect(detail.id_rango_sacerdotal).toBe(rangoObispoId);
    expect(detail.es_parroco).toBe(1);
    expect(detail.nombres).toBe('N' + MALE);
    expect(detail.sexo).toBe('M');
    const persona = await prisma.persona.findUniqueOrThrow({
      where: { id_parroquia_numero_identidad: { id_parroquia: cat.parishA, numero_identidad: MALE } },
    });
    expect(persona.nombres).toBe('N' + MALE);
    expect(persona.sexo).toBe('M');
  });

  it('detalle separa datos personales, clericales y conteos sacramentales', async () => {
    setSession(cat.parishA);
    await createClero(req(cleroBody(MALE)));
    const res = await getClero(getReq(`http://t/api/sacerdotes/${MALE}`), ctx(MALE));
    const detail = await res.json();
    expect(detail).toMatchObject({
      numero_identidad: MALE,
      nombres: 'N' + MALE,
      sexo: 'M',
      id_rango_sacerdotal: cat.rangoId,
      id_orden_religiosa: cat.ordenId,
      estado_ministerial: 1,
      sacramentos: { bautismos: 0, primeras_comuniones: 0, confirmaciones: 0, matrimonios: 0 },
    });
  });

  it('selector de Personas filtra sexo y estado vital sin cruzar tenant', async () => {
    setSession(cat.parishA);
    const res = await listPersonas(getReq('http://t/api/personas?lite=1&sexo=M&estado_vital=1'));
    expect(res.status).toBe(200);
    const personas = await res.json();
    expect(personas.some((p: { numero_identidad: string }) => p.numero_identidad === MALE)).toBe(true);
    expect(personas.some((p: { numero_identidad: string }) => p.numero_identidad === FEMALE)).toBe(false);
    expect(personas.some((p: { numero_identidad: string }) => p.numero_identidad === DEAD)).toBe(false);
    expect(personas.some((p: { numero_identidad: string }) => p.numero_identidad === BONLY)).toBe(false);
  });

  it('selector de Personas acepta estado desaparecido y rechaza filtros inválidos', async () => {
    setSession(cat.parishA);
    expect((await listPersonas(getReq('http://t/api/personas?lite=1&sexo=X'))).status).toBe(400);
    expect((await listPersonas(getReq('http://t/api/personas?lite=1&estado_vital=2'))).status).toBe(200);
  });
});

describe('Sacramentos con ministro tenant-safe', () => {
  it('18. bautismo acepta sacerdote del tenant', async () => {
    setSession(cat.parishA);
    const res = await createBautismo(
      req({
        numero_identidad_bautizado: P.bautizado,
        numero_identidad_madre: P.madre,
        numero_identidad_padre: P.padre,
        numero_identidad_madrina: P.madrina,
        numero_identidad_padrino: P.padrino,
        numero_identidad_catequista: P.catequista,
        numero_identidad_sacerdote: ACTIVE,
        fecha_bautismo: '2026-01-15',
        numero_folio: '1',
        numero_libro: '1',
        numero_pagina: '1',
        numero_registro: '501',
      })
    );
    expect(res.status).toBe(201);
  });

  it('19. bautismo rechaza sacerdote de otro tenant', async () => {
    setSession(cat.parishA);
    const res = await createBautismo(
      req({
        numero_identidad_bautizado: P.bautizado,
        numero_identidad_madre: P.madre,
        numero_identidad_padre: P.padre,
        numero_identidad_madrina: P.madrina,
        numero_identidad_padrino: P.padrino,
        numero_identidad_catequista: P.catequista,
        numero_identidad_sacerdote: BONLY,
        fecha_bautismo: '2026-01-15',
        numero_folio: '1',
        numero_libro: '3',
        numero_pagina: '1',
        numero_registro: '503',
      })
    );
    expect(res.status).toBe(400);
  });

  it('20. primera comunión acepta/rechaza tenant', async () => {
    setSession(cat.parishA);
    const ok = await createComunion(
      req({
        numero_identidad_persona: P.comunion,
        numero_identidad_madre: P.madre,
        numero_identidad_padre: P.padre,
        numero_identidad_catequista: P.catequista,
        numero_identidad_sacerdote: ACTIVE,
        fecha_primera_comunion: '2026-02-10',
        numero_acta: '1',
        numero_libro: '1',
        numero_pagina: '1',
        numero_registro: '601',
      })
    );
    expect(ok.status).toBe(201);
    const bad = await createComunion(
      req({
        numero_identidad_persona: P.comunion,
        numero_identidad_madre: P.madre,
        numero_identidad_padre: P.padre,
        numero_identidad_catequista: P.catequista,
        numero_identidad_sacerdote: BONLY,
        fecha_primera_comunion: '2026-02-10',
        numero_acta: '1',
        numero_libro: '1',
        numero_pagina: '1',
        numero_registro: '602',
      })
    );
    expect(bad.status).toBe(400);
  });

  it('21. confirmación acepta/rechaza tenant', async () => {
    setSession(cat.parishA);
    const ok = await createConfirmacion(
      req({
        numero_identidad_confirmado: P.confirmado,
        numero_identidad_madre: P.madre,
        numero_identidad_padre: P.padre,
        numero_identidad_madrina: P.madrina,
        numero_identidad_padrino: P.padrino,
        numero_identidad_catequista: P.catequista,
        numero_identidad_obispo: OBISPO,
        fecha_confirmacion: '2026-03-10',
        numero_acta: '1',
        numero_libro: '1',
        numero_pagina: '1',
        numero_registro: '701',
      })
    );
    expect(ok.status).toBe(201);
    const bad = await createConfirmacion(
      req({
        numero_identidad_confirmado: P.confirmado,
        numero_identidad_madre: P.madre,
        numero_identidad_padre: P.padre,
        numero_identidad_madrina: P.madrina,
        numero_identidad_padrino: P.padrino,
        numero_identidad_catequista: P.catequista,
        numero_identidad_obispo: BONLY,
        fecha_confirmacion: '2026-03-10',
        numero_acta: '1',
        numero_libro: '1',
        numero_pagina: '1',
        numero_registro: '702',
      })
    );
    expect(bad.status).toBe(400);
  });

  it('22. matrimonio acepta/rechaza tenant', async () => {
    setSession(cat.parishA);
    const ok = await createMatrimonio(
      req({
        numero_identidad_esposa: P.esposa,
        numero_identidad_esposo: P.esposo,
        numero_identidad_madrina: P.madrina,
        numero_identidad_padrino: P.padrino,
        numero_identidad_sacerdote: ACTIVE,
        fecha_matrimonio: '2026-04-10',
        numero_acta: '1',
        numero_libro: '1',
        numero_pagina: '1',
        numero_registro: '801',
      })
    );
    expect(ok.status).toBe(201);
    const bad = await createMatrimonio(
      req({
        numero_identidad_esposa: P.esposa,
        numero_identidad_esposo: P.esposo,
        numero_identidad_madrina: P.madrina,
        numero_identidad_padrino: P.padrino,
        numero_identidad_sacerdote: BONLY,
        fecha_matrimonio: '2026-04-10',
        numero_acta: '1',
        numero_libro: '1',
        numero_pagina: '1',
        numero_registro: '802',
      })
    );
    expect(bad.status).toBe(400);
  });

  it('23. selector lite filtra obispo por nombre de rango, sin IDs hardcodeados', async () => {
    setSession(cat.parishA);
    const lite = await (await listClero(getReq('http://t/api/sacerdotes?lite=1&rango=obispo'))).json();
    const dnis = lite.map((r: { numero_identidad: string }) => r.numero_identidad);
    expect(dnis).toContain(OBISPO);
    expect(dnis).not.toContain(INACT);
    expect(dnis).not.toContain(DEAD);
  });
});
