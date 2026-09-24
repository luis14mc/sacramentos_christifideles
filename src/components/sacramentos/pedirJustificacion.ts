import Swal from 'sweetalert2';
import { JUSTIFICACION_MAX, JUSTIFICACION_MIN, leerJustificacion } from '@/lib/justificacion';

/**
 * Pide la justificación de una modificación sacramental.
 * Devuelve null si el usuario cancela.
 */
export async function pedirJustificacion(): Promise<string | null> {
  const r = await Swal.fire({
    title: 'Justifica la modificación',
    input: 'textarea',
    inputLabel: 'Motivo del cambio (queda registrado en la auditoría)',
    inputPlaceholder: 'Ej. corrección del número de folio según el libro físico',
    inputAttributes: { maxlength: String(JUSTIFICACION_MAX) },
    showCancelButton: true,
    confirmButtonText: 'Guardar cambios',
    cancelButtonText: 'Cancelar',
    inputValidator: (v) =>
      leerJustificacion(v) ? undefined : `Escribe entre ${JUSTIFICACION_MIN} y ${JUSTIFICACION_MAX} caracteres`,
  });
  return r.isConfirmed ? String(r.value).trim() : null;
}
