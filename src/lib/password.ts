import { compare, hash } from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

/** Convierte el campo Bytes de Prisma a string bcrypt. */
export function passwordHashFromDb(contrasena: Uint8Array): string {
  return Buffer.from(contrasena).toString('utf8');
}

export async function verifyPassword(
  plain: string,
  stored: Uint8Array
): Promise<boolean> {
  const hashStr = passwordHashFromDb(stored);
  return compare(plain, hashStr);
}

export async function hashPassword(plain: string): Promise<Buffer> {
  const hashed = await hash(plain, BCRYPT_ROUNDS);
  return Buffer.from(hashed, 'utf8');
}
