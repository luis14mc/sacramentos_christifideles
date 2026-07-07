/** URLs de página alineadas con la tabla `pagina` (seed). */
export const PAGES = {
  DASHBOARD: '/dashboard',
  PERSONAS: '/personas',
  BAUTISMOS: '/bautismos',
  PRIMERA_COMUNION: '/primera-comunion',
  CONFIRMACIONES: '/confirmaciones',
  MATRIMONIOS: '/matrimonios',
  CONSTANCIAS: '/constancias',
  REPORTES: '/reportes',
  CONFIGURACION: '/configuracion',
  USUARIOS: '/usuarios',
} as const;

export type PageUrl = (typeof PAGES)[keyof typeof PAGES];

export type PermissionAction = 'ver' | 'crear' | 'actualizar' | 'borrar';
