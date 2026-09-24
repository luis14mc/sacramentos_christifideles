/**
 * Justificación obligatoria al modificar un registro sacramental.
 * Queda en bitacora_crud (new_values.justificacion) para reconstruir por qué
 * se cambió un registro. Módulo puro: lo usan las rutas y los formularios.
 */

export const JUSTIFICACION_MIN = 10;
export const JUSTIFICACION_MAX = 500;

export const ERROR_JUSTIFICACION = `Debes justificar la modificación (entre ${JUSTIFICACION_MIN} y ${JUSTIFICACION_MAX} caracteres).`;

export function leerJustificacion(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const v = valor.trim();
  return v.length >= JUSTIFICACION_MIN && v.length <= JUSTIFICACION_MAX ? v : null;
}
