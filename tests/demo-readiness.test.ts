import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { GET as healthGet } from '@/app/api/health/route';

const TEST_DB_URL = process.env.TEST_DATABASE_URL;
const adminPwd = 'TestAdmin2024!';
const secretarioPwd = 'TestSecretario2024!';
const catequistaPwd = 'TestCatequista2024!';

const prisma = new PrismaClient({
  datasources: { db: { url: TEST_DB_URL ?? '' } },
});

beforeAll(() => {
  if (!TEST_DB_URL) {
    throw new Error('TEST_DATABASE_URL is required.');
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function ensureBaseSeed() {
  const count = await prisma.parroquia.count({
    where: { nombre: 'Cristo Resucitado de Loarque' },
  });
  if (count === 0) {
    execSync('pnpm db:seed', {
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'pipe',
    });
  }
}

async function runDemoSeed() {
  await ensureBaseSeed();
  execSync('pnpm db:seed:demo', {
    env: {
      ...process.env,
      ALLOW_DEMO_SEED: 'true',
      DEMO_ADMIN_PASSWORD: adminPwd,
      DEMO_SECRETARIO_PASSWORD: secretarioPwd,
      DEMO_CATEQUISTA_PASSWORD: catequistaPwd,
    },
    stdio: 'pipe',
  });
}

describe('demo readiness · healthcheck', () => {
  it('GET /api/health -> 200 ok', async () => {
    const res = await healthGet();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(await res.json()).toEqual({ status: 'ok', database: 'ok' });
  });
});

describe('demo readiness · migraciones versionadas', () => {
  it('las 4 migraciones viven en prisma/migrations/', () => {
    const list = execSync('ls prisma/migrations', { encoding: 'utf8' });
    expect(list).toContain('20260922004338_init');
    expect(list).toContain('20260922004339_bautismo_padrino_madrina_opcional');
    expect(list).toContain('20260923120000_molde_constancia');
    expect(list).toContain('20260923130000_molde_constancia_unique_activo');
  });

  it('migration_lock.toml declara postgresql', () => {
    const lock = execSync('cat prisma/migrations/migration_lock.toml', {
      encoding: 'utf8',
    });
    expect(lock).toMatch(/provider\s*=\s*"postgresql"/);
  });
});

describe('demo readiness · demo seed', () => {
  beforeAll(async () => {
    await runDemoSeed();
    await runDemoSeed();
  });

  it('guard ALLOW_DEMO_SEED: falla sin la variable aunque haya passwords', () => {
    let code = 0;
    try {
      execSync('pnpm db:seed:demo', {
        env: {
          ...process.env,
          // sin ALLOW_DEMO_SEED
          DEMO_ADMIN_PASSWORD: adminPwd,
          DEMO_SECRETARIO_PASSWORD: secretarioPwd,
          DEMO_CATEQUISTA_PASSWORD: catequistaPwd,
        },
        stdio: 'pipe',
      });
    } catch (e) {
      const err = e as { status?: number; stderr?: Buffer };
      code = err.status ?? 1;
      const stderrText = err.stderr?.toString() ?? '';
      expect(stderrText).toMatch(/ALLOW_DEMO_SEED/);
    }
    expect(code).not.toBe(0);
  });

  it('carga parroquia demo con datos coherentes', async () => {
    const users = await prisma.usuario.count({ where: { email: { startsWith: 'demo-' } } });
    expect(users).toBe(3);

    const clero = await prisma.persona.count({
      where: {
        OR: [
          { numero_identidad: { startsWith: '0801-1965-90001' } },
          { numero_identidad: { startsWith: '0801-1975-90002' } },
          { numero_identidad: { startsWith: '0801-1958-90003' } },
          { numero_identidad: { startsWith: '0801-1978-90004' } },
        ],
      },
    });
    expect(clero).toBeGreaterThanOrEqual(4);

    expect(await prisma.bautismo.count()).toBeGreaterThanOrEqual(2);
    expect(await prisma.primeraComunion.count()).toBeGreaterThanOrEqual(2);
    expect(await prisma.confirmacion.count()).toBeGreaterThanOrEqual(2);
    expect(await prisma.matrimonio.count()).toBeGreaterThanOrEqual(1);
  });

  it('segunda ejecucion no duplica usuarios demo', async () => {
    const before = await prisma.usuario.count({ where: { email: { startsWith: 'demo-' } } });
    runDemoSeed();
    const after = await prisma.usuario.count({ where: { email: { startsWith: 'demo-' } } });
    expect(after).toBe(before);
  });

  it('segunda ejecucion no duplica sacramentos demo', async () => {
    const before = await prisma.bautismo.count();
    runDemoSeed();
    const after = await prisma.bautismo.count();
    expect(after).toBe(before);
  });
});

describe('demo readiness · RBAC demo usuarios', () => {
  beforeAll(runDemoSeed);

  it('admin -> Super Admin', async () => {
    const u = await prisma.usuario.findFirst({
      where: { email: 'demo-admin@cristoresucitado.org' },
      include: { rol: true },
    });
    expect(u?.rol.nombre).toBe('Super Admin');
    expect(u?.estado).toBe(1);
  });

  it('secretario -> Secretario', async () => {
    const u = await prisma.usuario.findFirst({
      where: { email: 'demo-secretario@cristoresucitado.org' },
      include: { rol: true },
    });
    expect(u?.rol.nombre).toBe('Secretario');
    expect(u?.estado).toBe(1);
  });

  it('catequista -> Catequista', async () => {
    const u = await prisma.usuario.findFirst({
      where: { email: 'demo-catequista@cristoresucitado.org' },
      include: { rol: true },
    });
    expect(u?.rol.nombre).toBe('Catequista');
    expect(u?.estado).toBe(1);
  });
});

describe('demo readiness · tenant consistency', () => {
  beforeAll(runDemoSeed);

  it('personas demo pertenecen a una sola parroquia', async () => {
    const ps = await prisma.persona.findMany({
      where: {
        OR: [
          { numero_identidad: { startsWith: '0801-1965-90001' } },
          { numero_identidad: { startsWith: '0801-1988-90101' } },
        ],
      },
      select: { id_parroquia: true },
      distinct: ['id_parroquia'],
    });
    const ids = new Set(ps.map((p) => p.id_parroquia));
    expect(ids.size).toBe(1);
  });

  it('sacramentos demo comparten id_parroquia', async () => {
    const parroquia = await prisma.parroquia.findFirstOrThrow({
      where: { nombre: 'Cristo Resucitado de Loarque' },
    });
    const expected = parroquia.id_parroquia;
    expect(
      await prisma.bautismo.findFirst({ where: { NOT: { id_parroquia: expected } } }),
    ).toBeNull();
    expect(
      await prisma.matrimonio.findFirst({ where: { NOT: { id_parroquia: expected } } }),
    ).toBeNull();
  });

  it('FKs de sacramentos apuntan a personas existentes', async () => {
    const b = await prisma.bautismo.findFirstOrThrow();
    const persona = await prisma.persona.findUnique({
      where: {
        id_parroquia_numero_identidad: {
          id_parroquia: b.id_parroquia,
          numero_identidad: b.numero_identidad_bautizado,
        },
      },
    });
    expect(persona).not.toBeNull();
  });
});
