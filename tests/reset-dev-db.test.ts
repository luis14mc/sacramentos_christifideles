import { describe, expect, it } from 'vitest';
import { validateResetEnvironment } from '../scripts/reset-dev-db';

const safeEnvironment = {
  NODE_ENV: 'development',
  ALLOW_DB_RESET: 'true',
  DATABASE_URL: 'postgresql://local:local@localhost:5432/christifideles_dev',
};

describe('development database reset guard', () => {
  it('allows an explicitly enabled local development database', () => {
    expect(validateResetEnvironment(safeEnvironment)).toEqual([]);
  });

  it('allows a remote database explicitly marked as testing', () => {
    expect(
      validateResetEnvironment({
        ...safeEnvironment,
        DATABASE_URL: 'postgresql://user:secret@example.neon.tech/christifideles_testing',
      }),
    ).toEqual([]);
  });

  it.each([
    [{ ...safeEnvironment, NODE_ENV: 'production' }, 'NODE_ENV is production'],
    [
      { ...safeEnvironment, NODE_ENV: undefined },
      'NODE_ENV must equal development or test',
    ],
    [{ ...safeEnvironment, ALLOW_DB_RESET: 'false' }, 'ALLOW_DB_RESET must equal true'],
    [{ ...safeEnvironment, CI: 'true' }, 'CI environments are not allowed'],
    [{ ...safeEnvironment, VERCEL: '1' }, 'Vercel environments are not allowed'],
    [
      { ...safeEnvironment, DATABASE_URL: 'postgresql://user:secret@db/prod' },
      'DATABASE_URL appears to target production',
    ],
    [
      { ...safeEnvironment, DATABASE_URL: 'postgresql://user:secret@example.neon.tech/main' },
      'DATABASE_URL is not explicitly marked as development or testing',
    ],
  ])('blocks unsafe environment %#', (environment, expectedError) => {
    expect(validateResetEnvironment(environment)).toContain(expectedError);
  });

  it('rejects absent and invalid database URLs without exposing their contents', () => {
    expect(validateResetEnvironment({ ...safeEnvironment, DATABASE_URL: undefined })).toContain(
      'DATABASE_URL is required',
    );
    expect(validateResetEnvironment({ ...safeEnvironment, DATABASE_URL: 'not a url' })).toContain(
      'DATABASE_URL is invalid',
    );
  });
});
