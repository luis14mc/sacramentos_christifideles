import { describe, it, expect } from 'vitest';
import { LimitadorLogin, MAX_INTENTOS, VENTANA_MS } from '@/lib/login-limiter';

const T0 = 1_790_000_000_000;

describe('LimitadorLogin', () => {
  it(`bloquea tras ${MAX_INTENTOS} fallos dentro de la ventana`, () => {
    const l = new LimitadorLogin();
    for (let i = 0; i < MAX_INTENTOS - 1; i++) l.registrarFallo('a@x.hn', T0 + i);
    expect(l.estaBloqueado('a@x.hn', T0 + 10)).toBe(false);
    l.registrarFallo('A@X.hn ', T0 + 10); // normaliza mayúsculas y espacios
    expect(l.estaBloqueado('a@x.hn', T0 + 11)).toBe(true);
  });

  it('el bloqueo expira al terminar la ventana', () => {
    const l = new LimitadorLogin();
    for (let i = 0; i < MAX_INTENTOS; i++) l.registrarFallo('a@x.hn', T0);
    expect(l.estaBloqueado('a@x.hn', T0 + VENTANA_MS - 1)).toBe(true);
    expect(l.estaBloqueado('a@x.hn', T0 + VENTANA_MS + 1)).toBe(false);
  });

  it('fallos viejos fuera de la ventana no cuentan', () => {
    const l = new LimitadorLogin();
    for (let i = 0; i < MAX_INTENTOS - 1; i++) l.registrarFallo('a@x.hn', T0);
    l.registrarFallo('a@x.hn', T0 + VENTANA_MS + 1);
    expect(l.estaBloqueado('a@x.hn', T0 + VENTANA_MS + 2)).toBe(false);
  });

  it('un login exitoso reinicia el contador y no afecta a otros emails', () => {
    const l = new LimitadorLogin();
    for (let i = 0; i < MAX_INTENTOS - 1; i++) l.registrarFallo('a@x.hn', T0);
    l.registrarExito('a@x.hn');
    l.registrarFallo('a@x.hn', T0 + 1);
    expect(l.estaBloqueado('a@x.hn', T0 + 2)).toBe(false);
    expect(l.estaBloqueado('b@x.hn', T0 + 2)).toBe(false);
  });
});
