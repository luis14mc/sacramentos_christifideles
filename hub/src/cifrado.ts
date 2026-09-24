import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Cifrado AES-256-GCM de los secretos HMAC de cada instancia.
 * Formato: base64(iv[12] | tag[16] | datos). Clave: HUB_CLAVE_MAESTRA (base64, 32 bytes).
 */

function clave(): Buffer {
  const raw = process.env.HUB_CLAVE_MAESTRA;
  const buf = raw ? Buffer.from(raw, 'base64') : Buffer.alloc(0);
  if (buf.length !== 32) {
    throw new Error('HUB_CLAVE_MAESTRA debe ser una clave base64 de 32 bytes.');
  }
  return buf;
}

export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', clave(), iv);
  const datos = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), datos]).toString('base64');
}

export function descifrar(cifrado: string): string {
  const buf = Buffer.from(cifrado, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', clave(), buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
}

/** Secreto HMAC nuevo para una instancia (se muestra una sola vez). */
export function generarSecreto(): string {
  return randomBytes(32).toString('base64url');
}
