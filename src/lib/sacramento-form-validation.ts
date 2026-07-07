import { z } from 'zod';
import { formatZodError } from '@/lib/validation';
import {
  bautismoBodySchema,
  confirmacionBodySchema,
  matrimonioBodySchema,
  primeraComunionBodySchema,
} from '@/lib/validators/schemas';

export type SacramentoFormTipo =
  | 'bautismo'
  | 'primera_comunion'
  | 'confirmacion'
  | 'matrimonio';

const schemaByTipo = {
  bautismo: bautismoBodySchema,
  primera_comunion: primeraComunionBodySchema,
  confirmacion: confirmacionBodySchema,
  matrimonio: matrimonioBodySchema,
} as const;

export function validateSacramentoFormClient(
  tipo: SacramentoFormTipo,
  data: unknown
): { ok: true } | { ok: false; error: string } {
  const schema = schemaByTipo[tipo];
  const result = schema.safeParse(data);
  if (result.success) return { ok: true };
  return { ok: false, error: formatZodError(result.error) };
}

export function getSacramentoSchema(tipo: SacramentoFormTipo): z.ZodType {
  return schemaByTipo[tipo];
}
