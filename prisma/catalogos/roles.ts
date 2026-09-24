/**
 * Roles del sistema sembrados en cada instancia. El nombre, normalizado, debe
 * existir en `rolePermissions` de src/lib/permissions.ts (lo verifica
 * tests/permissions.test.ts).
 */
export const ROLES: ReadonlyArray<readonly [nombre: string, descripcion: string]> = [
  ['Super Admin', 'Administrador del sistema completo'],
  ['Admin Parroquia', 'Administrador de la parroquia'],
  ['Párroco', 'Ve todo y autoriza todo'],
  ['Vicario', 'Vicario parroquial'],
  ['Sacerdote', 'Sacerdote'],
  ['Diácono', 'Diácono'],
  ['Secretaria', 'Registra y edita sacramentos (con justificación), sin borrar'],
  ['Catequista', 'Consulta personas y sacramentos'],
  ['Solo Lectura', 'Solo consulta de información'],
];
