/** Catálogos usados en formularios de personas y configuración. */

export interface SectorOption {
  id_sector_parroquial: number | string;
  nombre: string;
  id_parroquia?: number;
}

export interface OrdenReligiosaOption {
  id_orden_religiosa: number;
  nombre: string;
}

export interface DepartamentoOption {
  codigo_departamento: string;
  nombre_departamento: string;
}

export interface MunicipioOption {
  codigo_municipio: string;
  nombre_municipio: string;
  codigo_departamento?: string;
}

export interface PersonaRecord {
  numero_identidad: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento?: string;
  sexo?: string;
  telefono?: string;
  email?: string | null;
  direccion?: string | null;
  estado_vital?: number;
  estado_activo_parroquia?: number;
  id_sector_parroquial?: string | number;
  id_orden_religiosa?: string | number;
}
