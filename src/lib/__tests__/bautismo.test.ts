import { describe, expect, it } from 'vitest';
import { computeNextNumeracion, computeNextNumeracionActa } from '@/lib/numeradores';
import { validateBautismoInput } from '@/lib/bautismo';
import { validatePrimeraComunionInput } from '@/lib/primera-comunion';
import { validateConfirmacionInput } from '@/lib/confirmacion';
import { validateMatrimonioInput } from '@/lib/matrimonio';

describe('computeNextNumeracion', () => {
  it('incrementa el registro manteniendo libro y folio', () => {
    const result = computeNextNumeracion({
      ultimo_libro: 2,
      ultimo_folio: 5,
      ultimo_registro: 10,
    });

    expect(result.next).toEqual({
      ultimo_libro: 2,
      ultimo_folio: 5,
      ultimo_registro: 11,
    });
    expect(result.display).toEqual({
      numero_libro: '2',
      numero_folio: '5',
      numero_pagina: '5',
      numero_registro: '11',
    });
  });

  it('usa valores por defecto cuando el numerador está vacío', () => {
    const result = computeNextNumeracion({
      ultimo_libro: null,
      ultimo_folio: null,
      ultimo_registro: null,
    });

    expect(result.display.numero_libro).toBe('1');
    expect(result.display.numero_registro).toBe('1');
  });
});

describe('validateBautismoInput', () => {
  const validPayload = {
    numero_identidad_bautizado: '0801-1990-12345',
    numero_identidad_madre: '0801-1960-11111',
    numero_identidad_padre: '0801-1958-22222',
    numero_identidad_madrina: '0801-1985-33333',
    numero_identidad_padrino: '0801-1980-44444',
    numero_identidad_catequista: '0801-1975-55555',
    numero_identidad_sacerdote: '0801-1970-66666',
    fecha_bautismo: '2024-06-15',
  };

  it('acepta datos válidos', () => {
    const result = validateBautismoInput(validPayload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.numero_identidad_bautizado).toBe('0801-1990-12345');
    }
  });

  it('rechaza cuando falta el bautizado', () => {
    const result = validateBautismoInput({
      ...validPayload,
      numero_identidad_bautizado: '',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('bautizado');
    }
  });

  it('rechaza fecha inválida', () => {
    const result = validateBautismoInput({
      ...validPayload,
      fecha_bautismo: 'no-es-fecha',
    });
    expect(result.ok).toBe(false);
  });
});

describe('computeNextNumeracionActa', () => {
  it('incrementa acta y registro', () => {
    const result = computeNextNumeracionActa({
      ultimo_libro: 1,
      ultimo_folio: 3,
      ultimo_acta: 5,
      ultimo_registro: 10,
    });

    expect(result.display.numero_acta).toBe('6');
    expect(result.display.numero_registro).toBe('11');
  });
});

describe('validatePrimeraComunionInput', () => {
  const validPayload = {
    numero_identidad_persona: '0801-1995-12345',
    numero_identidad_madre: '0801-1960-11111',
    numero_identidad_padre: '0801-1958-22222',
    numero_identidad_catequista: '0801-1975-55555',
    numero_identidad_sacerdote: '0801-1970-66666',
    fecha_primera_comunion: '2024-05-20',
  };

  it('acepta datos válidos', () => {
    const result = validatePrimeraComunionInput(validPayload);
    expect(result.ok).toBe(true);
  });

  it('rechaza cuando falta el comunicante', () => {
    const result = validatePrimeraComunionInput({
      ...validPayload,
      numero_identidad_persona: '',
    });
    expect(result.ok).toBe(false);
  });
});

describe('validateConfirmacionInput', () => {
  const validPayload = {
    numero_identidad_confirmado: '0801-1998-12345',
    numero_identidad_madre: '0801-1960-11111',
    numero_identidad_padre: '0801-1958-22222',
    numero_identidad_madrina: '0801-1985-33333',
    numero_identidad_padrino: '0801-1980-44444',
    numero_identidad_catequista: '0801-1975-55555',
    numero_identidad_obispo: '0801-1970-66666',
    fecha_confirmacion: '2024-06-01',
  };

  it('acepta datos válidos', () => {
    expect(validateConfirmacionInput(validPayload).ok).toBe(true);
  });

  it('rechaza cuando falta el obispo', () => {
    const result = validateConfirmacionInput({
      ...validPayload,
      numero_identidad_obispo: '',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('identidad');
    }
  });
});

describe('validateMatrimonioInput', () => {
  const validPayload = {
    numero_identidad_esposo: '0801-1990-11111',
    numero_identidad_esposa: '0801-1992-22222',
    numero_identidad_padrino: '0801-1980-33333',
    numero_identidad_madrina: '0801-1985-44444',
    numero_identidad_sacerdote: '0801-1970-66666',
    fecha_matrimonio: '2024-08-15',
  };

  it('acepta datos mínimos válidos', () => {
    expect(validateMatrimonioInput(validPayload).ok).toBe(true);
  });

  it('acepta padres opcionales vacíos', () => {
    const result = validateMatrimonioInput({
      ...validPayload,
      numero_identidad_padre_esposo: '',
      numero_identidad_madre_esposa: '',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.numero_identidad_padre_esposo).toBeNull();
    }
  });

  it('rechaza cuando falta la esposa', () => {
    const result = validateMatrimonioInput({
      ...validPayload,
      numero_identidad_esposa: '',
    });
    expect(result.ok).toBe(false);
  });
});
