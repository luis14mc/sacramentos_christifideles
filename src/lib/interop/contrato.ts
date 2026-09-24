/**
 * Contrato HTTP instancia ↔ hub. Solo tipos y constantes (sin dependencias)
 * para que lo compartan la app parroquial y `hub/`.
 * Ver docs/PLAN_MULTIPARROQUIA.md, Fase 4.
 */

/** Valor de `x-interop-instancia` cuando quien firma es el hub. */
export const EMISOR_HUB = 'hub';

export const RUTAS_HUB = {
  instancias: '/api/instancias',
  solicitudes: '/api/solicitudes',
  respuesta: (uuid: string) => `/api/solicitudes/${uuid}/respuesta`,
} as const;

export const RUTAS_INSTANCIA = {
  entrantes: '/api/interop/entrantes',
  respuestas: '/api/interop/respuestas',
} as const;

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'error_envio';

export interface InstanciaPublica {
  codigo: string;
  nombre: string;
}

/** Instancia → hub: nueva consulta. */
export interface NuevaSolicitudHub {
  destino: string;
  numero_identidad: string;
  motivo: string;
}

/** Hub → instancia: respuesta a NuevaSolicitudHub. */
export interface SolicitudRegistradaHub {
  uuid: string;
  destino_nombre: string;
}

/** Hub → instancia destino: solicitud entrante. */
export interface SolicitudEntrante {
  uuid: string;
  origen: string;
  origen_nombre: string;
  numero_identidad: string;
  motivo: string;
}

export interface SacramentoCompartido {
  tipo: 'bautismo' | 'primera_comunion' | 'confirmacion' | 'matrimonio';
  fecha: string | null;
  libro: string;
  pagina: string | null;
  registro: string;
  folio: string | null;
}

/**
 * Datos que una parroquia comparte al aprobar. Mínimos a propósito: nunca
 * teléfono, email, dirección ni datos de padres o padrinos.
 */
export type RespuestaConsulta =
  | { encontrado: false }
  | {
      encontrado: true;
      nombres: string;
      apellidos: string;
      fecha_nacimiento: string;
      sacramentos: SacramentoCompartido[];
    };

/** Instancia destino → hub → instancia origen: resolución. */
export type ResolucionSolicitud =
  | { estado: 'aprobada'; respuesta: RespuestaConsulta }
  | { estado: 'rechazada'; motivo_rechazo: string };
