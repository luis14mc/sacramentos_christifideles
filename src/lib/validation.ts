import { z } from 'zod';

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Primer mensaje legible de un error Zod. */
export function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Datos inválidos';
  const path = issue.path.length > 0 ? `${String(issue.path.join('.'))}: ` : '';
  return `${path}${issue.message}`;
}

export function safeParseBody<T>(
  schema: z.ZodType<T>,
  body: unknown
): ValidationResult<T> {
  const result = schema.safeParse(body);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  return { ok: false, error: formatZodError(result.error) };
}

export function safeParseQuery<T>(
  schema: z.ZodType<T>,
  params: Record<string, string | null | undefined>
): ValidationResult<T> {
  return safeParseBody(schema, params);
}
