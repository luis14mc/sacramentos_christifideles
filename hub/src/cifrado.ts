import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Cifrado AES-256-GCM de los secretos HMAC de cada instancia.
 * Formato: base64(iv[12] | tag[16] | datos). Clave: HUB_CLAVE_MAESTRA (base64, 32 bytes).
 */

/**
 * Clave AES de 32 bytes. Lo recomendado es `openssl rand -base64 32`; si el valor
 * no es exactamente eso (p. ej. una frase), se deriva con SHA-256 para que el hub
 * funcione igual. Solo falla si la variable falta o es demasiado corta.
 */
export function clave(): Buffer {
  const raw = process.env.HUB_CLAVE_MAESTRA?.trim();
  if (!raw || raw.length < 16) {
    throw new Error('HUB_CLAVE_MAESTRA falta o es demasiado corta (usa `openssl rand -base64 32`).');
  }
  const b64 = Buffer.from(raw, 'base64');
  if (b64.length === 32 && /^[A-Za-z0-9+/]+={0,2}$/.test(raw)) return b64;
  return createHash('sha256').update(raw, 'utf8').digest();
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
