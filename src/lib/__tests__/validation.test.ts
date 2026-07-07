import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { formatZodError, safeParseBody, safeParseQuery } from '@/lib/validation';

describe('formatZodError', () => {
  it('incluye ruta y mensaje del primer issue', () => {
    const schema = z.object({ nombre: z.string().min(1, 'Requerido') });
    const result = schema.safeParse({ nombre: '' });
    if (result.success) throw new Error('expected failure');
    expect(formatZodError(result.error)).toBe('nombre: Requerido');
  });
});

describe('safeParseBody', () => {
  const schema = z.object({ id: z.string().min(1) });

  it('devuelve data cuando es válido', () => {
    const result = safeParseBody(schema, { id: 'abc' });
    expect(result).toEqual({ ok: true, data: { id: 'abc' } });
  });

  it('devuelve error legible cuando falla', () => {
    const result = safeParseBody(schema, { id: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('id');
    }
  });
});

describe('safeParseQuery', () => {
  it('parsea parámetros de query', () => {
    const schema = z.object({ q: z.string().min(1) });
    const result = safeParseQuery(schema, { q: 'buscar' });
    expect(result.ok).toBe(true);
  });
});
