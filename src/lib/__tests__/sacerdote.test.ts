import { describe, expect, it, vi } from 'vitest';
import {
  assertCleroNoDuplicado,
  assertPersonaExistsForClero,
  assertPersonaSinCleroActivo,
  cleroToSelectOption,
  filterCleroParaSacramento,
  findCleroActivo,
  isRangoAllowed,
  RANGOS_MINISTERIALES,
  RANGOS_SACRAMENTO_OBISPO,
  RANGOS_SACRAMENTO_SACERDOTE,
  serializeClero,
  validateCleroCreateInput,
} from '@/lib/sacerdote';
import type { TenantDb } from '@/lib/prisma-tenant';

const validCleroPayload = {
  numero_identidad: '0801-1990-12345',
  id_rango_sacerdotal: 2,
  id_orden_religiosa: 1,
  es_parroco: 0,
  estado_ministerial: 1,
};

const cleroMockBase = {
  numero_identidad: '0801-1990-12345',
  id_parroquia: 1,
  id_rango_sacerdotal: 2,
  id_orden_religiosa: 1,
  otra_orden_religiosa: null,
  es_parroco: 0,
  estado_ministerial: 1,
  imagen: null,
  rango: { id_rango_sacerdotal: 2, nombre: 'Presbítero', descripcion: null },
  orden_religiosa: { id_orden_religiosa: 1, nombre: 'Diocesano' },
  parroquia: { id_parroquia: 1, nombre: 'San José' },
  persona: {
    numero_identidad: '0801-1990-12345',
    nombres: 'Juan',
    apellidos: 'Pérez',
    telefono: '9999-9999',
    email: 'juan@test.com',
    fecha_nacimiento: new Date('1980-05-15'),
    lugar_nacimiento: '0801',
    sexo: 'M',
    estado_vital: 1,
  },
};

describe('validación de creación de clero', () => {
  it('1. no permite crear clero si la persona no existe', async () => {
    const db = {
      persona: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as TenantDb;

    const error = await assertPersonaExistsForClero(db, 1, '0801-1990-00000');
    expect(error).toBe('Debe registrar primero a la persona en el módulo Personas.');
  });

  it('2. crea clero usando solo datos clericales de una persona existente', () => {
    const result = validateCleroCreateInput(validCleroPayload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.numero_identidad).toBe('0801-1990-12345');
      expect('nombres' in result.data).toBe(false);
      expect('apellidos' in result.data).toBe(false);
    }
  });

  it('3. no duplica datos personales en orden_sacerdotal', () => {
    const result = validateCleroCreateInput({
      ...validCleroPayload,
      nombres: 'Ignorado',
      apellidos: 'Ignorado',
      telefono: '0000',
      email: 'x@y.com',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect('nombres' in result.data).toBe(false);
      expect('telefono' in result.data).toBe(false);
    }
  });

  it('4. no permite crear dos registros clericales para la misma persona', async () => {
    const db = {
      ordenSacerdotal: {
        findFirst: vi.fn().mockResolvedValue({ numero_identidad: '0801-1990-12345' }),
      },
    } as unknown as TenantDb;

    const error = await assertCleroNoDuplicado(db, 1, '0801-1990-12345');
    expect(error).toContain('Ya existe un registro clerical');
  });
});

describe('grados ministeriales', () => {
  it('5. permite asignar grado Diácono', () => {
    expect(isRangoAllowed('Diácono', RANGOS_MINISTERIALES)).toBe(true);
  });

  it('6. permite asignar grado Sacerdote/Presbítero', () => {
    expect(isRangoAllowed('Presbítero', RANGOS_MINISTERIALES)).toBe(true);
    expect(isRangoAllowed('Sacerdote', RANGOS_MINISTERIALES)).toBe(true);
  });

  it('7. permite asignar grado Obispo', () => {
    expect(isRangoAllowed('Obispo', RANGOS_MINISTERIALES)).toBe(true);
  });
});

describe('serialización y sacramentos', () => {
  it('8. el listado muestra datos personales desde persona', () => {
    const serialized = serializeClero(cleroMockBase);
    expect(serialized.persona.nombres).toBe('Juan');
    expect(serialized.persona.apellidos).toBe('Pérez');
    expect('nombres' in serialized).toBe(false);
    expect(serialized.estado_ministerial).toBe(1);
  });

  it('9. desactivar clero no elimina la persona', async () => {
    const db = {
      ordenSacerdotal: { findFirst: vi.fn().mockResolvedValue(null) },
      persona: {
        findFirst: vi.fn().mockResolvedValue({ numero_identidad: '0801-1990-12345' }),
      },
    } as unknown as TenantDb;

    const cleroResult = await findCleroActivo(
      db,
      1,
      '0801-1990-12345',
      RANGOS_SACRAMENTO_SACERDOTE
    );
    const personaResult = await assertPersonaExistsForClero(db, 1, '0801-1990-12345');

    expect(cleroResult.ok).toBe(false);
    expect(personaResult).toBeNull();
  });

  it('10. sacramentos encuentran sacerdote/obispo desde orden_sacerdotal', async () => {
    const dbSacerdote = {
      ordenSacerdotal: { findFirst: vi.fn().mockResolvedValue(cleroMockBase) },
    } as unknown as TenantDb;

    const sacerdote = await findCleroActivo(
      dbSacerdote,
      1,
      '0801-1990-12345',
      RANGOS_SACRAMENTO_SACERDOTE
    );
    expect(sacerdote.ok).toBe(true);

    const dbObispo = {
      ordenSacerdotal: {
        findFirst: vi.fn().mockResolvedValue({
          ...cleroMockBase,
          rango: { nombre: 'Obispo' },
        }),
      },
    } as unknown as TenantDb;

    const obispo = await findCleroActivo(
      dbObispo,
      1,
      '0801-1990-12345',
      RANGOS_SACRAMENTO_OBISPO
    );
    expect(obispo.ok).toBe(true);

    const diaconoComoObispo = await findCleroActivo(
      dbSacerdote,
      1,
      '0801-1990-12345',
      RANGOS_SACRAMENTO_OBISPO
    );
    expect(diaconoComoObispo.ok).toBe(false);
  });
});

describe('protección de persona con clero activo', () => {
  it('no permite borrar persona con registro clerical activo', async () => {
    const db = {
      ordenSacerdotal: {
        findFirst: vi.fn().mockResolvedValue({ numero_identidad: '0801-1990-12345' }),
      },
    } as unknown as TenantDb;

    const error = await assertPersonaSinCleroActivo(db, 1, '0801-1990-12345');
    expect(error).toContain('registro clerical activo');
  });
});

describe('utilidades de selectores sacramentales', () => {
  it('cleroToSelectOption usa nombre desde persona', () => {
    const option = cleroToSelectOption(cleroMockBase);
    expect(option.nombres).toBe('Juan');
    expect(option.apellidos).toBe('Pérez');
  });

  it('filterCleroParaSacramento filtra obispos activos', () => {
    const lista = [
      { estado_ministerial: 1, rango: { nombre: 'Obispo' } },
      { estado_ministerial: 1, rango: { nombre: 'Presbítero' } },
      { estado_ministerial: 0, rango: { nombre: 'Obispo' } },
    ];
    const obispos = filterCleroParaSacramento(lista, 'obispo');
    expect(obispos).toHaveLength(1);
    expect(obispos[0].rango?.nombre).toBe('Obispo');
  });
});
