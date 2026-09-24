import type { SolicitudInterop } from '@prisma/client';

/** Límites de validación compartidos por las rutas de interoperabilidad. */
export const MAX_DNI = 20;
export const MAX_MOTIVO = 500;

export function textoValido(valor: unknown, max: number): string | null {
  if (typeof valor !== 'string') return null;
  const v = valor.trim();
  return v && v.length <= max ? v : null;
}

/** Serializa para JSON (BigInt → string). */
export function serializarSolicitud(s: SolicitudInterop) {
  return {
    id_solicitud: s.id_solicitud.toString(),
    uuid: s.uuid,
    direccion: s.direccion,
    codigo_parroquia_contraparte: s.codigo_parroquia_contraparte,
    nombre_parroquia_contraparte: s.nombre_parroquia_contraparte,
    numero_identidad_consultado: s.numero_identidad_consultado,
    motivo: s.motivo,
    estado: s.estado,
    motivo_rechazo: s.motivo_rechazo,
    respuesta: s.respuesta,
    created_at: s.created_at.toISOString(),
    resuelta_at: s.resuelta_at?.toISOString() ?? null,
  };
}
