import { describe, expect, it } from 'vitest';
import {
  getDefaultTemplate,
  isSacramentoConstanciaTipo,
  renderConstancia,
} from '@/lib/constancias';

describe('renderConstancia', () => {
  it('reemplaza placeholders en la plantilla', () => {
    const html = renderConstancia(
      'Hola {{nombre_completo}}, bautizado el {{fecha_sacramento}}.',
      {
        nombre_completo: 'Juan Pérez',
        fecha_sacramento: '15 de junio de 2024',
      }
    );
    expect(html).toContain('Juan Pérez');
    expect(html).toContain('15 de junio de 2024');
    expect(html).not.toContain('{{');
  });

  it('deja vacío un placeholder sin valor', () => {
    const html = renderConstancia('Nota: {{nota_marginal}}', {});
    expect(html).toBe('Nota: ');
  });
});

describe('getDefaultTemplate', () => {
  it('incluye plantilla para cada sacramento', () => {
    expect(getDefaultTemplate('bautismo')).toContain('BAUTISMO');
    expect(getDefaultTemplate('matrimonio')).toContain('MATRIMONIO');
  });
});

describe('isSacramentoConstanciaTipo', () => {
  it('valida tipos conocidos', () => {
    expect(isSacramentoConstanciaTipo('bautismo')).toBe(true);
    expect(isSacramentoConstanciaTipo('invalido')).toBe(false);
  });
});
