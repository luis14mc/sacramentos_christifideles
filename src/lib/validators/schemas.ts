import { z } from 'zod';

/** Identidad hondureña u otro documento parroquial (máx. 20 caracteres). */
export const identidadSchema = z
  .string()
  .trim()
  .min(1, 'La identidad es obligatoria')
  .max(20, 'Identidad demasiado larga');

export const identidadOptionalSchema = z
  .string()
  .trim()
  .max(20)
  .optional()
  .nullable()
  .transform((v) => (v && v.length > 0 ? v : null));

export const fechaSacramentoSchema = z
  .string()
  .trim()
  .min(1, 'La fecha es obligatoria')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida');

export const notaMarginalSchema = z
  .string()
  .max(1000)
  .optional()
  .nullable()
  .transform((v) => (v === undefined || v === null || v === '' ? null : v.slice(0, 1000)));

export const numeracionOptionalSchema = z.string().trim().optional();

export const bautismoBodySchema = z.object({
  numero_identidad_bautizado: identidadSchema,
  numero_identidad_madre: identidadSchema,
  numero_identidad_padre: identidadSchema,
  numero_identidad_madrina: identidadSchema,
  numero_identidad_padrino: identidadSchema,
  numero_identidad_catequista: identidadSchema,
  numero_identidad_sacerdote: identidadSchema,
  fecha_bautismo: fechaSacramentoSchema,
  nota_marginal: notaMarginalSchema,
  numero_libro: numeracionOptionalSchema,
  numero_folio: numeracionOptionalSchema,
  numero_pagina: numeracionOptionalSchema,
  numero_registro: numeracionOptionalSchema,
});

export const primeraComunionBodySchema = z.object({
  numero_identidad_persona: identidadSchema,
  numero_identidad_madre: identidadSchema,
  numero_identidad_padre: identidadSchema,
  numero_identidad_catequista: identidadSchema,
  numero_identidad_sacerdote: identidadSchema,
  fecha_primera_comunion: fechaSacramentoSchema,
  nota_marginal: notaMarginalSchema,
  numero_libro: numeracionOptionalSchema,
  numero_acta: numeracionOptionalSchema,
  numero_pagina: numeracionOptionalSchema,
  numero_registro: numeracionOptionalSchema,
});

export const confirmacionBodySchema = z.object({
  numero_identidad_confirmado: identidadSchema,
  numero_identidad_madre: identidadSchema,
  numero_identidad_padre: identidadSchema,
  numero_identidad_madrina: identidadSchema,
  numero_identidad_padrino: identidadSchema,
  numero_identidad_catequista: identidadSchema,
  numero_identidad_obispo: identidadSchema,
  fecha_confirmacion: fechaSacramentoSchema,
  nota_marginal: notaMarginalSchema,
  numero_libro: numeracionOptionalSchema,
  numero_acta: numeracionOptionalSchema,
  numero_pagina: numeracionOptionalSchema,
  numero_registro: numeracionOptionalSchema,
});

export const matrimonioBodySchema = z.object({
  numero_identidad_esposo: identidadSchema,
  numero_identidad_esposa: identidadSchema,
  numero_identidad_padrino: identidadSchema,
  numero_identidad_madrina: identidadSchema,
  numero_identidad_sacerdote: identidadSchema,
  numero_identidad_padre_esposo: identidadOptionalSchema,
  numero_identidad_madre_esposo: identidadOptionalSchema,
  numero_identidad_padre_esposa: identidadOptionalSchema,
  numero_identidad_madre_esposa: identidadOptionalSchema,
  fecha_matrimonio: fechaSacramentoSchema,
  nota_marginal: notaMarginalSchema,
  numero_libro: numeracionOptionalSchema,
  numero_acta: numeracionOptionalSchema,
  numero_pagina: numeracionOptionalSchema,
  numero_registro: numeracionOptionalSchema,
});

export const personaCreateSchema = z.object({
  numero_identidad: identidadSchema,
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios').max(100),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios').max(100),
  fecha_nacimiento: fechaSacramentoSchema,
  sector_id: z.union([z.string(), z.number()]).optional(),
  id_sector_parroquial: z.union([z.string(), z.number()]).optional(),
  genero: z.string().optional(),
  sexo: z.string().optional(),
  telefono: z.string().trim().optional(),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  direccion: z.string().trim().optional(),
  municipio_id: z.string().trim().optional(),
  lugar_nacimiento: z.string().trim().optional(),
  id_orden_religiosa: z.union([z.string(), z.number()]).optional(),
});

export const constanciaGenerarSchema = z.object({
  tipo: z.enum(['bautismo', 'primera_comunion', 'confirmacion', 'matrimonio']),
  registroId: z.string().trim().min(1, 'El registro es obligatorio'),
});

export const constanciaBuscarSchema = z.object({
  identidad: identidadSchema,
});

export type BautismoBody = z.infer<typeof bautismoBodySchema>;
export type PrimeraComunionBody = z.infer<typeof primeraComunionBodySchema>;
export type ConfirmacionBody = z.infer<typeof confirmacionBodySchema>;
export type MatrimonioBody = z.infer<typeof matrimonioBodySchema>;
export const personaUpdateSchema = personaCreateSchema.partial().extend({
  estado_vital: z.union([z.string(), z.number()]).optional(),
  estado_activo_parroquia: z.union([z.string(), z.number()]).optional(),
  otra_orden_religiosa: z.string().trim().optional().nullable(),
  imagen: z.string().trim().optional().nullable(),
});

export const usuarioCreateSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  rol: z.string().trim().min(1, 'El rol es obligatorio'),
  telefono: z.string().trim().optional(),
  activo: z.boolean().optional(),
  parroquiaId: z.union([z.string(), z.number()]).optional(),
});

export const usuarioUpdateSchema = z.object({
  id: z.union([z.string(), z.number()]),
  nombre: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().optional(),
  telefono: z.string().trim().optional(),
  rol: z.string().trim().optional(),
  activo: z.boolean().optional(),
  password: z.string().min(8).optional().or(z.literal('')),
});

export const permisosFlagsSchema = z.object({
  leer: z.boolean().optional(),
  escribir: z.boolean().optional(),
  eliminar: z.boolean().optional(),
  administrar: z.boolean().optional(),
});

export const permisoPostSchema = z.object({
  id_rol: z.union([z.string(), z.number()]),
  id_pagina: z.union([z.string(), z.number()]),
  permisos: permisosFlagsSchema,
});

export const permisoBulkPutSchema = z.object({
  rol_id: z.union([z.string(), z.number()]),
  permisos_bulk: z.record(z.string(), permisosFlagsSchema),
});

export const configGeneralUpdateSchema = z.object({
  parroquia: z
    .object({
      id_parroquia: z.union([z.string(), z.number()]).optional(),
      nombre: z.string().trim().optional(),
      direccion: z.string().trim().optional(),
      telefono: z.string().trim().optional(),
      email: z.string().trim().email().optional().or(z.literal('')),
      ubicacion: z.string().trim().optional(),
    })
    .optional(),
  configuracion: z
    .object({
      alias_liturgico: z.string().trim().optional(),
      logo_url: z.string().trim().optional().nullable(),
      sello_digital_url: z.string().trim().optional().nullable(),
      tz: z.string().trim().optional(),
      idioma: z.string().trim().optional(),
      opciones: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export const sectorCreateSchema = z.object({
  id_tipo_sector_parroquial: z.union([z.string(), z.number()]),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(255),
  nombre_capilla: z.string().trim().optional().nullable(),
  direccion: z.string().trim().optional(),
});

export const sectorUpdateSchema = sectorCreateSchema.extend({
  id_sector_parroquial: z.union([z.string(), z.number()]),
});

export const rolParroquialCreateSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(255),
  descripcion: z.string().trim().optional().nullable(),
});

export const grupoCreateSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(255),
  descripcion: z.string().trim().optional().nullable(),
});

export const sacerdoteCreateSchema = z.object({
  numero_identidad: identidadSchema,
  nombres: z.string().trim().min(1).max(100),
  apellidos: z.string().trim().min(1).max(100),
  id_rango_sacerdotal: z.union([z.string(), z.number()]),
  id_orden_religiosa: z.union([z.string(), z.number()]).optional(),
  fecha_nacimiento: z.string().trim().optional().nullable(),
  lugar_nacimiento: z.string().trim().optional().nullable(),
  telefono: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  otra_orden_religiosa: z.string().trim().optional().nullable(),
  es_parroco: z.union([z.string(), z.number()]).optional(),
  estado_vital: z.union([z.string(), z.number()]).optional(),
  imagen: z.string().trim().optional().nullable(),
});

export const setupSchema = z.object({
  nombreParroquia: z.string().trim().min(1, 'Nombre de parroquia obligatorio'),
  municipio: z.string().trim().min(1),
  direccion: z.string().trim().min(1),
  telefono: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal('')),
  nombreAdmin: z.string().trim().min(1),
  emailAdmin: z.string().trim().email(),
  passwordAdmin: z.string().min(8, 'Contraseña admin mínimo 8 caracteres'),
  setupSecret: z.string().optional(),
});

export const logoUploadSchema = z.object({
  type: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  size: z.number().max(2 * 1024 * 1024, 'Máximo 2MB'),
});

export type PersonaUpdateBody = z.infer<typeof personaUpdateSchema>;
