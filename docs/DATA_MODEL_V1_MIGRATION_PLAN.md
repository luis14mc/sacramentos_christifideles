# Plan de migración del modelo de datos — ChristiFideles v1.0

Fecha: 2026-08-19

## Objetivo

Eliminar la dependencia técnica del DNI y preparar la base para registros sacramentales históricos, multi-parroquia y el módulo de defunciones.

## Fase A — Persona

### Modelo objetivo

- `id_persona BigInt @id @default(autoincrement())`
- `id_parroquia Int`
- `numero_identidad String?`
- `nombres String`
- `apellidos String`
- `fecha_nacimiento DateTime?`
- `lugar_nacimiento String?`
- `sexo String?`
- `telefono String?`
- `id_sector_parroquial BigInt?`
- `id_orden_religiosa Int?`

Constraint de negocio:

```prisma
@@unique([id_parroquia, numero_identidad])
@@unique([id_persona, id_parroquia])
@@index([id_parroquia, apellidos, nombres])
```

El DNI deja de ser clave primaria y nunca se generará un DNI ficticio.

## Fase B — Ministros

`OrdenSacerdotal` pasa a tener:

- `id_sacerdote BigInt @id @default(autoincrement())`
- `numero_identidad String?`

Los sacramentos apuntarán a `id_sacerdote`, no al DNI. El ministro podrá ser opcional para partidas antiguas.

## Fase C — Relaciones sacramentales

### Bautismo

Obligatorio:
- bautizado
- parroquia
- fecha de bautismo
- referencia registral disponible

Opcional:
- madre
- padre
- padrino
- madrina
- catequista
- sacerdote
- notas

Todas las personas se referencian por `id_persona`.

### Primera Comunión

Persona principal obligatoria; padre, madre, catequista y sacerdote opcionales.

### Confirmación

Persona principal obligatoria; padre, madre, padrinos, catequista y obispo opcionales.

### Matrimonio

Esposo y esposa obligatorios; padres, padrinos y sacerdote opcionales.

## Fase D — Defunciones

Nuevo modelo `Defuncion`:

- `id_defuncion`
- `id_parroquia`
- `id_persona`
- `id_sacerdote?`
- `fecha_defuncion`
- `fecha_exequias?`
- `lugar_sepultura?`
- `numero_libro?`
- `numero_folio?`
- `numero_pagina?`
- `numero_registro?`
- `observaciones?`
- timestamps

## Fase E — Grupos

`GrupoParroquial` pasa a pertenecer a una parroquia (`id_parroquia`).

`RolParroquial` se mantiene como catálogo global en v1.

`TrPersonaGrupoRol` referenciará `id_persona`, no DNI, y conservará `id_parroquia` para aislamiento.

## Fase F — CRUD Personas

El frontend y API deben migrar de:

```text
/api/personas/{numero_identidad}
```

a:

```text
/api/personas/{id_persona}
```

La búsqueda por DNI se mantiene como filtro, no como identificador técnico.

### Reglas de formulario

Solo nombres y apellidos son obligatorios a nivel de persona histórica, además de la parroquia tomada de la sesión.

DNI, fecha de nacimiento, municipio, sexo, teléfono, sector y orden religiosa pueden quedar vacíos.

## Estrategia para datos existentes

No se aplicará un `db push --force-reset` sobre una base persistente.

Orden recomendado:

1. Crear columnas `id_persona` / `id_sacerdote` y poblar IDs.
2. Agregar nuevas FKs en tablas relacionadas.
3. Copiar referencias desde DNI a los nuevos IDs mediante JOIN por parroquia.
4. Validar conteos y referencias huérfanas.
5. Cambiar PK/constraints.
6. Eliminar las FKs antiguas basadas en DNI cuando la aplicación ya opere por IDs.
7. Ejecutar pruebas de regresión.
8. Tomar backup antes de aplicar la migración en staging o producción.

## Gates obligatorios

El PR no puede mergearse si falla cualquiera de estos controles:

- `npx prisma validate`
- `npx prisma generate`
- `npx prisma db push` contra PostgreSQL vacío de CI
- `npm run lint`
- `npm run build`
- CRUD Persona con persona con DNI
- CRUD Persona sin DNI
- aislamiento Parroquia A/B
- no existen nuevas FKs de sacramentos basadas en `numero_identidad`

## Definition of Done

El modelo de datos v1 se considera terminado cuando una persona histórica sin DNI puede ser creada, consultada y vinculada a un sacramento sin valores ficticios, y la misma operación permanece aislada por parroquia.
