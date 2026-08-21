import { describe, it, expect, afterAll } from 'vitest';
import { GET } from '@/app/api/health/route';
import { prisma } from '@/lib/prisma';

describe('GET /api/health', () => {
  it('responde ok cuando PostgreSQL está disponible', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(await res.json()).toEqual({ status: 'ok', database: 'ok' });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
