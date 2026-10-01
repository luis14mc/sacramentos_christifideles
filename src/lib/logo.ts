/**
 * Validación del logo de la parroquia. Se verifica el contenido real del
 * archivo (firma de bytes), no solo el tipo que declara el navegador.
 */

export const MAX_LOGO_BYTES = 1024 * 1024; // 1 MB

export type MimeLogo = 'image/png' | 'image/jpeg';

export function detectarMimeLogo(buf: Uint8Array): MimeLogo | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'image/png';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  return null;
}

export type ResultadoLogo = { ok: true; mime: MimeLogo } | { ok: false; error: string };

export function validarLogo(buf: Uint8Array): ResultadoLogo {
  if (buf.byteLength === 0) return { ok: false, error: 'El archivo está vacío' };
  if (buf.byteLength > MAX_LOGO_BYTES) return { ok: false, error: 'El logo no puede pesar más de 1 MB' };
  const mime = detectarMimeLogo(buf);
  if (!mime) return { ok: false, error: 'Solo se admiten imágenes PNG o JPG' };
  return { ok: true, mime };
}
