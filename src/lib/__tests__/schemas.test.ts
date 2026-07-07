import { describe, expect, it } from 'vitest';
import {
  bautismoBodySchema,
  confirmacionBodySchema,
  constanciaBuscarSchema,
  constanciaGenerarSchema,
  identidadSchema,
  matrimonioBodySchema,
  personaCreateSchema,
  primeraComunionBodySchema,
} from '@/lib/validators/schemas';

describe('identidadSchema', () => {
  it('acepta identidad válida', () => {
    expect(identidadSchema.safeParse('0801-1990-12345').success).toBe(true);
  });

  it('rechaza cadena vacía', () => {
    const result = identidadSchema.safeParse('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('obligatoria');
    }
  });

  it('rechaza identidad demasiado larga', () => {
    expect(identidadSchema.safeParse('x'.repeat(21)).success).toBe(false);
  });
});

describe('constanciaGenerarSchema', () => {
  it('acepta tipo y registro válidos', () => {
    const result = constanciaGenerarSchema.safeParse({
      tipo: 'bautismo',
      registroId: '42',
    });
    expect(result.success).toBe(true);
  });

  it('rechaza tipo inválido', () => {
    expect(
      constanciaGenerarSchema.safeParse({ tipo: 'otro', registroId: '1' }).success
    ).toBe(false);
  });

  it('rechaza registro vacío', () => {
    expect(
      constanciaGenerarSchema.safeParse({ tipo: 'bautismo', registroId: '' }).success
    ).toBe(false);
  });
});

describe('constanciaBuscarSchema', () => {
  it('requiere identidad', () => {
    expect(constanciaBuscarSchema.safeParse({ identidad: '' }).success).toBe(false);
  });
});

describe('personaCreateSchema', () => {
  const valid = {
    numero_identidad: '0801-1990-12345',
    nombres: 'Juan',
    apellidos: 'Pérez',
    fecha_nacimiento: '1990-01-15',
  };

  it('acepta datos mínimos', () => {
    expect(personaCreateSchema.safeParse(valid).success).toBe(true);
  });

  it('rechaza email inválido', () => {
    expect(
      personaCreateSchema.safeParse({ ...valid, email: 'no-es-email' }).success
    ).toBe(false);
  });

  it('acepta email vacío', () => {
    expect(personaCreateSchema.safeParse({ ...valid, email: '' }).success).toBe(true);
  });
});

describe('sacramento body schemas', () => {
  it('bautismo requiere todas las identidades', () => {
    const result = bautismoBodySchema.safeParse({
      numero_identidad_bautizado: '0801-1998-12345',
      fecha_bautismo: '2024-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('primera comunión valida fecha', () => {
    const result = primeraComunionBodySchema.safeParse({
      numero_identidad_persona: '0801-1998-12345',
      numero_identidad_madre: '0801-1960-11111',
      numero_identidad_padre: '0801-1958-22222',
      numero_identidad_catequista: '0801-1975-55555',
      numero_identidad_sacerdote: '0801-1970-66666',
      fecha_primera_comunion: 'fecha-mala',
    });
    expect(result.success).toBe(false);
  });

  it('confirmación exige obispo', () => {
    const result = confirmacionBodySchema.safeParse({
      numero_identidad_confirmado: '0801-1998-12345',
      numero_identidad_madre: '0801-1960-11111',
      numero_identidad_padre: '0801-1958-22222',
      numero_identidad_madrina: '0801-1985-33333',
      numero_identidad_padrino: '0801-1980-44444',
      numero_identidad_catequista: '0801-1975-55555',
      numero_identidad_obispo: '',
      fecha_confirmacion: '2024-06-01',
    });
    expect(result.success).toBe(false);
  });

  it('matrimonio normaliza padres opcionales vacíos a null', () => {
    const result = matrimonioBodySchema.safeParse({
      numero_identidad_esposo: '0801-1990-11111',
      numero_identidad_esposa: '0801-1992-22222',
      numero_identidad_padrino: '0801-1980-33333',
      numero_identidad_madrina: '0801-1985-44444',
      numero_identidad_sacerdote: '0801-1970-66666',
      numero_identidad_padre_esposo: '',
      fecha_matrimonio: '2024-08-15',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.numero_identidad_padre_esposo).toBeNull();
    }
  });
});
