import { spawnSync } from 'node:child_process';
import { loadEnvFile } from 'node:process';
import { pathToFileURL } from 'node:url';

try {
  loadEnvFile();
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

export type ResetEnvironment = Record<string, string | undefined>;

export function validateResetEnvironment(env: ResetEnvironment): string[] {
  const errors: string[] = [];
  const databaseUrl = env.DATABASE_URL ?? '';

  if (env.NODE_ENV === 'production') errors.push('NODE_ENV is production');
  else if (env.NODE_ENV !== 'development' && env.NODE_ENV !== 'test') {
    errors.push('NODE_ENV must equal development or test');
  }
  if (env.ALLOW_DB_RESET !== 'true') errors.push('ALLOW_DB_RESET must equal true');
  if (env.CI) errors.push('CI environments are not allowed');
  if (env.VERCEL || env.VERCEL_ENV) errors.push('Vercel environments are not allowed');
  if (!databaseUrl) errors.push('DATABASE_URL is required');

  try {
    if (databaseUrl) {
      const url = new URL(databaseUrl);
      const databaseName = url.pathname.slice(1).toLowerCase();
      const markerText = `${url.hostname}/${databaseName}`;
      const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      if (/(^|[-_.\/])(prod|production)([-_.\/]|$)/i.test(markerText)) {
        errors.push('DATABASE_URL appears to target production');
      } else if (
        !isLocal &&
        !/(^|[-_.\/])(dev|development|test|testing|staging)([-_.\/]|$)/i.test(markerText)
      ) {
        errors.push('DATABASE_URL is not explicitly marked as development or testing');
      }
    }
  } catch {
    errors.push('DATABASE_URL is invalid');
  }

  return errors;
}

export function main(env: ResetEnvironment = process.env): number {
  const errors = validateResetEnvironment(env);
  if (errors.length > 0) {
    console.error(`Development database reset blocked: ${errors.join('; ')}`);
    return 1;
  }

  const childEnvironment = { ...process.env, ...env };
  const reset = spawnSync('pnpm', ['exec', 'prisma', 'db', 'push', '--force-reset'], {
    stdio: 'inherit',
    env: childEnvironment,
  });
  if (reset.error) {
    console.error('Development database reset failed to start.');
    return 1;
  }
  if (reset.status !== 0) return reset.status ?? 1;

  const seed = spawnSync('pnpm', ['db:seed'], { stdio: 'inherit', env: childEnvironment });
  if (seed.error) {
    console.error('Development database seed failed to start.');
    return 1;
  }
  return seed.status ?? 1;
}

const entrypoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : '';
if (import.meta.url === entrypoint) process.exitCode = main();
