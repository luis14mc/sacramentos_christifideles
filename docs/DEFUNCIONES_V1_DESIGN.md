# Defunciones v1 — Diseño (solo propuesta, sin implementación)

Fecha: 2026-08-20
Estado: **DISEÑO**. En este sprint NO se implementa código, tabla, modelo Prisma, migración, API ni UI. No se modifica `estado_vital` automáticamente. Este documento es propuesta, **no** fuente de verdad; la fuente de verdad sigue siendo `docs/christi_fidelis_bdd_pg_v3.sql`.

## A. Problema
El módulo de Defunciones **no existe** actualmente:
- No hay tabla `defuncion` en `docs/christi_fidelis_bdd_pg_v3.sql` (verificado: 0 coincidencias).
- No hay `model Defuncion` en `prisma/schema.prisma` (verificado: 0 coincidencias).

Se requiere registrar la defunción de una Persona ya existente, como módulo administrativo parroquial, preservando la cadena Persona → parroquia → registro → auditoría.

## B. Principio (no negociable)
La **Persona fallecida debe existir previamente** en `Persona`, dentro de la parroquia de sesión. No se crea Persona desde Defunciones; no se aceptan DNIs de texto libre ni ficticios. Mismo patrón que el resto de sacramentos.

## C. Tenant
Toda defunción pertenece a un `id_parroquia`, derivado **siempre** de `session.user.parishId`. Nunca de body/query/params. Un recurso concreto de otra parroquia responde **404** (no 403), como el resto de módulos.

## D. Relación con Persona (FK compuesta tenant-safe)
Propuesta: FK compuesta, coherente con el resto del modelo:

```
(id_parroquia, numero_identidad_persona) → Persona(id_parroquia, numero_identidad)
```

En Prisma (propuesta, NO aplicar aún):

```prisma
persona Persona @relation("PersonaDefuncion", fields: [id_parroquia, numero_identidad_persona], references: [id_parroquia, numero_identidad])
```

Esto garantiza que la persona fallecida pertenezca a la misma parroquia.

## E. Estado vital
`Persona.estado_vital` usa el CHECK del SQL v3: `0 = fallecido`, `1 = vivo`, `2` (reservado). Al registrar una defunción, `estado_vital` de la Persona debería pasar a `0`.

**Propuesta de comportamiento (a decidir por Product Owner):**
- Actualizar `Persona.estado_vital = 0` **dentro de la misma `prisma.$transaction`** que crea la Defunción y su bitácora, de modo que las tres escrituras sean atómicas (no queda una defunción sin reflejar el estado, ni un estado cambiado sin defunción).
- Al **anular/corregir** una defunción (flujo futuro, no v1), habría que decidir si se revierte `estado_vital` a `1`. Como no hay DELETE físico (ver J), esta reversión requeriría un flujo explícito y auditado.
- Alternativa conservadora: **no** tocar `estado_vital` automáticamente y dejarlo como acción separada/manual. Requiere decisión del PO (ver K).

## F. Campos candidatos (PROPUESTA, no source of truth)
```
id_defuncion            BigInt PK (autoincrement)
id_parroquia            Int (tenant)
numero_identidad_persona String (FK compuesta a Persona)
fecha_defuncion         DateTime (requerido)
lugar_defuncion         String? (opcional)
causa_defuncion         String? (opcional)
fecha_exequias          DateTime? (opcional)
lugar_sepultura         String? (opcional)
numero_libro            String (registral)
numero_pagina           String? (opcional, como en otros libros)
numero_registro         String (registral)
nota_marginal           String? (opcional)
created_at              DateTime @default(now())
updated_at              DateTime @updatedAt
```
Los tipos exactos (longitudes, nullability final) deben confirmarse contra el estilo del SQL v3 antes de implementar. `numero_acta` podría añadirse si el PO lo requiere (los otros libros lo tienen).

## G. Ministro que preside las exequias
Propuesta: campo **opcional** `numero_identidad_sacerdote` con FK compuesta tenant-safe, reutilizando el patrón validado en PR #8:

```
(id_parroquia, numero_identidad_sacerdote) → OrdenSacerdotal(id_parroquia, numero_identidad)
```

Validado con `validarMinistroTenant(...)` **solo si se informa** (exequias pueden no tener ministro registrado). A confirmar por el PO si debe ser obligatorio.

## H. Unicidad registral
Propuesta, consistente con los demás libros:

```
@@unique([id_parroquia, numero_libro, numero_pagina, numero_registro])
```

Con pre-check → **409** y captura de `P2002` → 409, igual que Bautismo/Comunión/Confirmación/Matrimonio.

## I. Auditoría
CREATE y UPDATE registran en `bitacora_crud` (acciones `C` / `U`, tabla `defuncion`) usando `src/lib/bitacora.ts`, dentro de la misma `$transaction` que la escritura (y el eventual cambio de `estado_vital`).

## J. Delete
**Sin borrado físico**, igual que el resto de sacramentos: la defunción es historia eclesial. Una futura anulación/corrección se diseñará aparte, con su propia auditoría.

## K. Preguntas pendientes para el Product Owner
1. ¿La defunción debe cambiar `Persona.estado_vital = 0` automáticamente (dentro de la transacción) o es una acción separada?
2. Si se cambia automáticamente, ¿cómo se revierte ante una corrección/anulación futura?
3. ¿El ministro de exequias es obligatorio u opcional?
4. ¿Se requiere `numero_acta` además de libro/página/registro?
5. ¿`causa_defuncion` es un texto libre o un catálogo controlado?
6. ¿Existe requisito de reportería/estadística que condicione campos adicionales (p. ej. edad al fallecer, parentesco del declarante)?
7. ¿Debe impedirse registrar dos defunciones para la misma Persona (unicidad por `numero_identidad_persona` dentro de la parroquia)?

## Alcance de este sprint
Solo este documento. **Cero** cambios de base de datos, esquema, migraciones, API o UI para Defunciones.
