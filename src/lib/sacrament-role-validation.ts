export type SacramentRoleValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export interface RoleIdentidad {
  label: string;
  identidad: string | null | undefined;
}

function normalizeIdentidad(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Verifica que la persona principal del acto no ocupe otro rol en el mismo sacramento.
 */
export function validatePrimaryNotInOtherRoles(
  primary: { label: string; identidad: string },
  otherRoles: RoleIdentidad[]
): SacramentRoleValidationResult {
  const primaryId = normalizeIdentidad(primary.identidad);
  if (!primaryId) return { ok: true };

  for (const role of otherRoles) {
    const roleId = normalizeIdentidad(role.identidad);
    if (roleId && roleId === primaryId) {
      return {
        ok: false,
        error: `La persona registrada como ${primary.label} (${primaryId}) no puede ser la misma que ${role.label}.`,
      };
    }
  }

  return { ok: true };
}

export function validateBautismoRoleConflicts(data: {
  numero_identidad_bautizado: string;
  numero_identidad_madre: string;
  numero_identidad_padre: string;
  numero_identidad_madrina: string;
  numero_identidad_padrino: string;
  numero_identidad_catequista: string;
  numero_identidad_sacerdote: string;
}): SacramentRoleValidationResult {
  return validatePrimaryNotInOtherRoles(
    { label: 'bautizado', identidad: data.numero_identidad_bautizado },
    [
      { label: 'madre', identidad: data.numero_identidad_madre },
      { label: 'padre', identidad: data.numero_identidad_padre },
      { label: 'madrina', identidad: data.numero_identidad_madrina },
      { label: 'padrino', identidad: data.numero_identidad_padrino },
      { label: 'catequista', identidad: data.numero_identidad_catequista },
      { label: 'sacerdote', identidad: data.numero_identidad_sacerdote },
    ]
  );
}

export function validatePrimeraComunionRoleConflicts(data: {
  numero_identidad_persona: string;
  numero_identidad_madre: string;
  numero_identidad_padre: string;
  numero_identidad_catequista: string;
  numero_identidad_sacerdote: string;
}): SacramentRoleValidationResult {
  return validatePrimaryNotInOtherRoles(
    { label: 'comunicante', identidad: data.numero_identidad_persona },
    [
      { label: 'madre', identidad: data.numero_identidad_madre },
      { label: 'padre', identidad: data.numero_identidad_padre },
      { label: 'catequista', identidad: data.numero_identidad_catequista },
      { label: 'sacerdote', identidad: data.numero_identidad_sacerdote },
    ]
  );
}

export function validateConfirmacionRoleConflicts(data: {
  numero_identidad_confirmado: string;
  numero_identidad_madre: string;
  numero_identidad_padre: string;
  numero_identidad_madrina: string;
  numero_identidad_padrino: string;
  numero_identidad_catequista: string;
  numero_identidad_obispo: string;
}): SacramentRoleValidationResult {
  return validatePrimaryNotInOtherRoles(
    { label: 'confirmado', identidad: data.numero_identidad_confirmado },
    [
      { label: 'madre', identidad: data.numero_identidad_madre },
      { label: 'padre', identidad: data.numero_identidad_padre },
      { label: 'madrina', identidad: data.numero_identidad_madrina },
      { label: 'padrino', identidad: data.numero_identidad_padrino },
      { label: 'catequista', identidad: data.numero_identidad_catequista },
      { label: 'obispo', identidad: data.numero_identidad_obispo },
    ]
  );
}

export function validateMatrimonioRoleConflicts(data: {
  numero_identidad_esposo: string;
  numero_identidad_esposa: string;
  numero_identidad_padrino: string;
  numero_identidad_madrina: string;
  numero_identidad_sacerdote: string;
  numero_identidad_padre_esposo: string | null;
  numero_identidad_madre_esposo: string | null;
  numero_identidad_padre_esposa: string | null;
  numero_identidad_madre_esposa: string | null;
}): SacramentRoleValidationResult {
  const esposo = normalizeIdentidad(data.numero_identidad_esposo);
  const esposa = normalizeIdentidad(data.numero_identidad_esposa);

  if (esposo && esposa && esposo === esposa) {
    return {
      ok: false,
      error: 'El esposo y la esposa no pueden ser la misma persona.',
    };
  }

  const otherRoles: RoleIdentidad[] = [
    { label: 'padrino', identidad: data.numero_identidad_padrino },
    { label: 'madrina', identidad: data.numero_identidad_madrina },
    { label: 'sacerdote', identidad: data.numero_identidad_sacerdote },
    { label: 'padre del esposo', identidad: data.numero_identidad_padre_esposo },
    { label: 'madre del esposo', identidad: data.numero_identidad_madre_esposo },
    { label: 'padre de la esposa', identidad: data.numero_identidad_padre_esposa },
    { label: 'madre de la esposa', identidad: data.numero_identidad_madre_esposa },
  ];

  if (esposo) {
    const esposoCheck = validatePrimaryNotInOtherRoles(
      { label: 'esposo', identidad: esposo },
      [...otherRoles, { label: 'esposa', identidad: esposa }]
    );
    if (!esposoCheck.ok) return esposoCheck;
  }

  if (esposa) {
    const esposaCheck = validatePrimaryNotInOtherRoles(
      { label: 'esposa', identidad: esposa },
      [...otherRoles, { label: 'esposo', identidad: esposo }]
    );
    if (!esposaCheck.ok) return esposaCheck;
  }

  return { ok: true };
}
