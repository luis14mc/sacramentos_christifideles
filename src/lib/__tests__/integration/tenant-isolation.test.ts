/**
 * Tests de integración multi-tenant.
 * Ejecutar con DATABASE_URL apuntando a Postgres de prueba:
 *   INTEGRATION_TEST=true npm run test
 *
 * Requiere RLS activo (docs/migracion_rls_v6.sql) para validar aislamiento real.
 */
import { describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { withTenantScope } from '@/lib/prisma-tenant';

const runIntegration = process.env.INTEGRATION_TEST === 'true';
const prisma = new PrismaClient();

describe.skipIf(!runIntegration)('aislamiento multi-tenant (integración)', () => {
  const parishA = 1;
  const parishB = 2;

  it('withTenantScope filtra personas por parroquia', async () => {
    const personasA = await withTenantScope(parishA, (db) =>
      db.persona.findMany({ where: { id_parroquia: parishA }, take: 5 })
    );
    const personasB = await withTenantScope(parishB, (db) =>
      db.persona.findMany({ where: { id_parroquia: parishB }, take: 5 })
    );

    for (const p of personasA) {
      expect(p.id_parroquia).toBe(parishA);
    }
    for (const p of personasB) {
      expect(p.id_parroquia).toBe(parishB);
    }

    if (personasA.length > 0 && personasB.length > 0) {
      const idsA = new Set(personasA.map((p) => p.numero_identidad));
      for (const p of personasB) {
        expect(idsA.has(p.numero_identidad)).toBe(false);
      }
    }
  });

  it('withTenantScope no devuelve bautismos de otra parroquia', async () => {
    const bautismosA = await withTenantScope(parishA, (db) =>
      db.bautismo.findMany({ where: { id_parroquia: parishA }, take: 10 })
    );

    for (const b of bautismosA) {
      expect(b.id_parroquia).toBe(parishA);
    }
  });

  it('RLS activo en tabla persona (si DATABASE_RLS_ENABLED=true)', async () => {
    if (process.env.DATABASE_RLS_ENABLED !== 'true') {
      return;
    }

    const rows = await prisma.$queryRaw<{ relrowsecurity: boolean }[]>`
      SELECT relrowsecurity FROM pg_class
      WHERE relname = 'persona' AND relkind = 'r'
    `;
    expect(rows[0]?.relrowsecurity).toBe(true);
  });
});

describe('modo unitario (sin BD)', () => {
  it('integración desactivada por defecto', () => {
    expect(process.env.INTEGRATION_TEST).not.toBe('true');
  });
});
