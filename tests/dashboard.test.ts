import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const { mockGetServerSession } = vi.hoisted(() => ({ mockGetServerSession: vi.fn() }));
vi.mock('next-auth/next', () => ({ getServerSession: mockGetServerSession }));
vi.mock('@/lib/auth', () => ({ default: {}, authOptions: {} }));

import { prisma } from '@/lib/prisma';
import { GET as getDashboard } from '@/app/api/dashboard/route';
import { setupCatalogo, seedPersona, seedSacerdote, limpiarCatalogo, type Catalogo } from './helpers/sacramentos-fixtures';

let cat: Catalogo;
let usuarioA: string;
let usuarioB: string;
const P = { b: 'BZ1', m: 'MD1', p: 'PD1', mn: 'MN1', pn: 'PN1', c: 'CT1' };
const SAC = 'SAC-A';

function setSession(userId: string | null, parishId: number) {
  if (userId === null) mockGetServerSession.mockResolvedValue(null);
  else mockGetServerSession.mockResolvedValue({ user: { id: userId, parishId: String(parishId), rol: 'administrador' } });
}

beforeAll(async () => {
  cat = await setupCatalogo();
  const rol = await prisma.rolUsuario.create({ data: { nombre: 'Administrador', id_usuario_creacion: BigInt(1) } });
  const uA = await prisma.usuario.create({
    data: { id_parroquia: cat.parishA, id_rol: rol.id_rol, nombre: 'Admin A', email: 'a@test.local', contrasena: Buffer.from('x'), estado: 1, id_usuario_creacion: BigInt(1) },
  });
  const uB = await prisma.usuario.create({
    data: { id_parroquia: cat.parishB, id_rol: rol.id_rol, nombre: 'Admin B', email: 'b@test.local', contrasena: Buffer.from('x'), estado: 1, id_usuario_creacion: BigInt(1) },
  });
  usuarioA = uA.id_usuario.toString();
  usuarioB = uB.id_usuario.toString();

  for (const dni of Object.values(P)) await seedPersona(cat.parishA, dni, cat.sectorA, cat.ordenId);
  await seedSacerdote(cat.parishA, SAC, cat.rangoId, cat.ordenId, cat.sectorA);
  await prisma.bautismo.create({
    data: {
      id_parroquia: cat.parishA,
      numero_identidad_bautizado: P.b, numero_identidad_madre: P.m, numero_identidad_padre: P.p,
      numero_identidad_madrina: P.mn, numero_identidad_padrino: P.pn, numero_identidad_catequista: P.c,
      numero_identidad_sacerdote: SAC, fecha_bautismo: new Date(), // este mes
      numero_folio: '1', numero_libro: '1', numero_pagina: '1', numero_registro: '1',
    },
  });
});
afterAll(async () => {
  await prisma.bautismo.deleteMany({});
  await limpiarCatalogo();
  await prisma.$disconnect();
});

describe('GET /api/dashboard', () => {
  it('sin sesión -> 401', async () => {
    setSession(null, cat.parishA);
    expect((await getDashboard()).status).toBe(401);
  });
  it('usuario inexistente en la parroquia -> 404', async () => {
    setSession('999999', cat.parishA);
    expect((await getDashboard()).status).toBe(404);
  });
  it('tenant A: conteos reales, mes y recientes', async () => {
    setSession(usuarioA, cat.parishA);
    const res = await getDashboard();
    expect(res.status).toBe(200);
    const json = await res.json();
    // 6 participantes + el sacerdote, que ahora también existe como Persona.
    expect(json.stats.totalPersonas).toBe(7);
    expect(json.stats.totalBautismos).toBe(1);
    expect(json.stats.sacramentosDelMes).toBeGreaterThanOrEqual(1);
    expect(json.recientes.length).toBe(1);
    expect(json.recientes[0].tipo).toBe('Bautismo');
  });
  it('tenant B: conteos independientes (0)', async () => {
    setSession(usuarioB, cat.parishB);
    const json = await (await getDashboard()).json();
    expect(json.stats.totalPersonas).toBe(0);
    expect(json.stats.totalBautismos).toBe(0);
    expect(json.recientes.length).toBe(0);
  });
});
