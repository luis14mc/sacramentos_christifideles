import { describe, it, expect } from 'vitest';
import {
  cabecerasFirmadas,
  verificarFirma,
  CABECERA_FIRMA,
  CABECERA_TIMESTAMP,
  DESFASE_MAXIMO_MS,
} from '@/lib/interop/firma';

const SECRETO = 'secreto-de-prueba';
const AHORA = 1_790_000_000_000;
const RUTA = '/api/interop/entrantes';
const CUERPO = JSON.stringify({ uuid: 'abc', numero_identidad: '0801199900001' });

function firmar(cuerpo = CUERPO, ahora = AHORA) {
  const h = cabecerasFirmadas(SECRETO, 'hub', 'POST', RUTA, cuerpo, ahora);
  return { timestamp: h[CABECERA_TIMESTAMP], firma: h[CABECERA_FIRMA] };
}

describe('firma interop', () => {
  it('acepta una firma válida', () => {
    const { timestamp, firma } = firmar();
    expect(
      verificarFirma(SECRETO, { timestamp, firma, metodo: 'post', ruta: RUTA, cuerpo: CUERPO }, AHORA)
    ).toEqual({ ok: true });
  });

  it('rechaza si el cuerpo fue alterado', () => {
    const { timestamp, firma } = firmar();
    const res = verificarFirma(
      SECRETO,
      { timestamp, firma, metodo: 'POST', ruta: RUTA, cuerpo: CUERPO.replace('abc', 'xyz') },
      AHORA
    );
    expect(res).toEqual({ ok: false, motivo: 'firma' });
  });

  it('rechaza otro secreto', () => {
    const { timestamp, firma } = firmar();
    expect(
      verificarFirma('otro', { timestamp, firma, metodo: 'POST', ruta: RUTA, cuerpo: CUERPO }, AHORA).ok
    ).toBe(false);
  });

  it('rechaza timestamps fuera de ventana (replay)', () => {
    const { timestamp, firma } = firmar();
    const res = verificarFirma(
      SECRETO,
      { timestamp, firma, metodo: 'POST', ruta: RUTA, cuerpo: CUERPO },
      AHORA + DESFASE_MAXIMO_MS + 1
    );
    expect(res).toEqual({ ok: false, motivo: 'timestamp' });
  });

  it('rechaza cabeceras faltantes o firma malformada', () => {
    expect(
      verificarFirma(SECRETO, { timestamp: '', firma: null, metodo: 'POST', ruta: RUTA, cuerpo: '' }, AHORA)
    ).toEqual({ ok: false, motivo: 'cabeceras' });
    expect(
      verificarFirma(
        SECRETO,
        { timestamp: String(AHORA), firma: 'zz', metodo: 'POST', ruta: RUTA, cuerpo: CUERPO },
        AHORA
      )
    ).toEqual({ ok: false, motivo: 'firma' });
  });
});
