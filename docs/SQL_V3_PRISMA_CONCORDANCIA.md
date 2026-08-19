# Matriz de concordancia — SQL v3 vs Prisma

Fecha: 2026-08-19
Fuente funcional: `docs/christi_fidelis_bdd_pg_v3.sql`
Implementación ORM: `prisma/schema.prisma`

## Regla de gobierno

Para ChristiFidelis v1, el SQL v3 define la lógica funcional del modelo. Prisma debe reflejar esa lógica salvo que exista una decisión de arquitectura documentada que indique lo contrario.

## Núcleo Persona

### SQL v3
- `numero_identidad` obligatorio.
- `id_parroquia` obligatorio.
- PK compuesta `(id_parroquia, numero_identidad)`.
- sector, orden religiosa, fecha de nacimiento, municipio de nacimiento, sexo y teléfono obligatorios.
- estado vital y estado activo parroquial controlados.

### Prisma actual
- Mantiene los mismos campos obligatorios.
- Mantiene `@@id([id_parroquia, numero_identidad])`.
- Mantiene índice por parroquia/apellidos e identidad.

### Estado
✅ Alineado.

### Regla funcional derivada
`Persona` es el core. No se permite crear ninguna relación sacramental para una persona que no exista previamente dentro de la misma parroquia.

## Parroquia y multi-tenant

### SQL v3
Todas las entidades operativas principales utilizan `id_parroquia` y las relaciones de Persona en sacramentos son FKs compuestas `(id_parroquia, numero_identidad)`.

### Prisma actual
Las relaciones Persona de Bautismo, Primera Comunión, Confirmación y Matrimonio utilizan correctamente `[id_parroquia, numero_identidad_*]` hacia `[id_parroquia, numero_identidad]`.

### Estado
✅ Alineado para Persona.

## Orden sacerdotal / ministros

### SQL v3
`orden_sacerdotal` mantiene `numero_identidad` como PK global y además `UNIQUE(id_parroquia, numero_identidad)` para habilitar FKs compuestas. Cada sacramento relaciona sacerdote/obispo mediante `(id_parroquia, numero_identidad)`.

### Prisma actual
`OrdenSacerdotal` contiene `@@unique([id_parroquia, numero_identidad])`, pero Bautismo, Primera Comunión, Confirmación y Matrimonio relacionan al ministro solo por `numero_identidad`.

### Estado
❌ Divergencia de seguridad/consistencia.

### Acción v1
Cambiar las relaciones Prisma de ministro a:
- Bautismo: `[id_parroquia, numero_identidad_sacerdote]`.
- Primera Comunión: `[id_parroquia, numero_identidad_sacerdote]`.
- Confirmación: `[id_parroquia, numero_identidad_obispo]`.
- Matrimonio: `[id_parroquia, numero_identidad_sacerdote]`.

Referencias: `[id_parroquia, numero_identidad]` de `OrdenSacerdotal`.

## Roles y permisos

### SQL v3
`RolUsuario`, `Pagina` y `TrRolPagina` definen permisos `puede_ver`, `puede_crear`, `puede_actualizar`, `puede_borrar`.

### Prisma actual
El modelo conserva las mismas tablas y campos.

### Estado
✅ Modelo alineado.

Nota: el backend v1 además aplica RBAC desde servidor; la matriz runtime no sustituye la estructura persistente.

## Grupos parroquiales

### SQL v3
`GrupoParroquial` y `RolParroquial` son catálogos globales. La membresía `TrPersonaGrupoRol` conserva `id_parroquia` y FK compuesta hacia Persona.

### Prisma actual
Refleja el mismo diseño.

### Estado
✅ Alineado.

No agregar `id_parroquia` a `GrupoParroquial` en v1 sin un requerimiento funcional nuevo.

## Numeradores

### SQL v3
Numeradores por `(id_parroquia, modulo, scope)` con libro, folio, acta y registro.

### Prisma actual
Refleja la misma unicidad y campos.

### Estado
✅ Alineado.

## Unicidad registral de sacramentos

SQL v3 y Prisma utilizan unicidad por:
`(id_parroquia, numero_libro, numero_pagina, numero_registro)`.

### Estado
✅ Alineado.

## Bitácora

### SQL v3
- `bitacora_crud`
- `bitacora_login`
- `bitacora_persona_parroquia`

### Prisma actual
Contiene los tres modelos principales.

### Estado
✅ Estructura base alineada.

Pendiente funcional: comprobar que todas las operaciones de escritura efectivamente registren auditoría.

## RLS

### SQL v3
Define Row Level Security para Persona, sacramentos y bitácora CRUD utilizando `current_setting('app.tenant_id')`.

### Prisma actual
Prisma Schema no representa políticas RLS.

### Estado
⚠️ Pendiente de infraestructura/migración SQL.

### Acción antes de producción
Definir migración SQL versionada para políticas RLS y estrategia segura para establecer el tenant por transacción/conexión cuando se use Prisma con Neon. No activar RLS en producción hasta validar el comportamiento con pooling de conexiones.

## Checks SQL no expresados directamente en Prisma

El SQL v3 incluye checks para:
- sexo `F/M`;
- rama de orden religiosa `F/M/N`;
- estado vital `0/1/2`;
- estado activo parroquia `0/1`;
- acción de bitácora `C/R/U/D`.

Prisma modela estos campos como `String`/`Int` sin esos checks declarativos.

### Estado
⚠️ Parcialmente alineado.

### Acción v1
Mantener validación en aplicación y agregar constraints mediante migraciones SQL versionadas antes de producción.

## Defunciones

No existe en el SQL v3 original ni en Prisma actual.

### Estado
🟡 Extensión propuesta de v1.

Debe diseñarse respetando la regla central: la persona fallecida debe existir previamente en `Persona` y la relación debe permanecer dentro de `id_parroquia`.

## Prioridades resultantes

P0:
1. Persona como prerequisito obligatorio.
2. Aislamiento multi-parroquia en API.
3. Corregir relaciones compuestas de ministros.
4. No aceptar tenant desde el cliente.

P1:
1. Auditoría efectiva.
2. Constraints SQL.
3. Estrategia RLS compatible con Prisma/Neon.
4. Numeradores transaccionales.

P2:
1. Defunciones.
2. Vistas de apoyo/certificados.

## Regla para agentes IA

Antes de modificar modelos de datos, revisar este documento y el SQL v3. No cambiar la identidad de `Persona`, obligatoriedad del DNI, alcance de grupos/roles o estrategia multi-tenant sin una decisión funcional explícita del Product Owner.