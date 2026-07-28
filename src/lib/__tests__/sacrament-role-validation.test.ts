import { describe, expect, it } from 'vitest';
import { validateBautismoInput } from '@/lib/bautismo';
import { validateConfirmacionInput } from '@/lib/confirmacion';
import { validateMatrimonioInput } from '@/lib/matrimonio';
import { validatePrimeraComunionInput } from '@/lib/primera-comunion';

describe('conflictos de roles sacramentales', () => {
  const bautismoBase = {
    numero_identidad_bautizado: '0801-1990-12345',
    numero_identidad_madre: '0801-1960-11111',
    numero_identidad_padre: '0801-1958-22222',
    numero_identidad_madrina: '0801-1985-33333',
    numero_identidad_padrino: '0801-1980-44444',
    numero_identidad_catequista: '0801-1975-55555',
    numero_identidad_sacerdote: '0801-1970-66666',
    fecha_bautismo: '2024-06-15',
  };

  const confirmacionBase = {
    numero_identidad_confirmado: '0801-1998-12345',
    numero_identidad_madre: '0801-1960-11111',
    numero_identidad_padre: '0801-1958-22222',
    numero_identidad_madrina: '0801-1985-33333',
    numero_identidad_padrino: '0801-1980-44444',
    numero_identidad_catequista: '0801-1975-55555',
    numero_identidad_obispo: '0801-1970-66666',
    fecha_confirmacion: '2024-06-01',
  };

  const primeraComunionBase = {
    numero_identidad_persona: '0801-1995-12345',
    numero_identidad_madre: '0801-1960-11111',
    numero_identidad_padre: '0801-1958-22222',
    numero_identidad_catequista: '0801-1975-55555',
    numero_identidad_sacerdote: '0801-1970-66666',
    fecha_primera_comunion: '2024-05-20',
  };

  const matrimonioBase = {
    numero_identidad_esposo: '0801-1990-11111',
    numero_identidad_esposa: '0801-1992-22222',
    numero_identidad_padrino: '0801-1980-33333',
    numero_identidad_madrina: '0801-1985-44444',
    numero_identidad_sacerdote: '0801-1970-66666',
    fecha_matrimonio: '2024-08-15',
  };

  it('rechaza bautizado repetido como padrino', () => {
    const result = validateBautismoInput({
      ...bautismoBase,
      numero_identidad_padrino: bautismoBase.numero_identidad_bautizado,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('bautizado');
      expect(result.error).toContain('padrino');
    }
  });

  it('rechaza confirmado repetido como madre', () => {
    const result = validateConfirmacionInput({
      ...confirmacionBase,
      numero_identidad_madre: confirmacionBase.numero_identidad_confirmado,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('confirmado');
      expect(result.error).toContain('madre');
    }
  });

  it('rechaza comunicante repetido como catequista', () => {
    const result = validatePrimeraComunionInput({
      ...primeraComunionBase,
      numero_identidad_catequista: primeraComunionBase.numero_identidad_persona,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('comunicante');
      expect(result.error).toContain('catequista');
    }
  });

  it('rechaza esposo igual a esposa', () => {
    const result = validateMatrimonioInput({
      ...matrimonioBase,
      numero_identidad_esposa: matrimonioBase.numero_identidad_esposo,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('esposo');
      expect(result.error).toContain('esposa');
    }
  });

  it('rechaza esposa repetida como madrina', () => {
    const result = validateMatrimonioInput({
      ...matrimonioBase,
      numero_identidad_madrina: matrimonioBase.numero_identidad_esposa,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('esposa');
      expect(result.error).toContain('madrina');
    }
  });
});
