# ADR-001 — Persona como núcleo y DNI obligatorio

**Estado:** Aceptado para ChristiFideles v1.0  
**Fecha:** 2026-08-19  
**Responsables:** Scrum Master / Tech Lead / DBA

## Contexto

ChristiFideles se basa en la entidad `Persona`. Ningún sacramento, grupo, relación familiar o registro parroquial funcional debe existir sin que las personas involucradas estén registradas previamente.

Para la v1 se establece además que **no puede existir una Persona sin DNI**. El DNI es obligatorio y forma parte de la identidad de negocio del registro.

## Decisión

1. `Persona` es el centro y core funcional del sistema.
2. `numero_identidad` (DNI) es obligatorio para crear una Persona.
3. Se mantiene el identificador actual compuesto `@@id([id_parroquia, numero_identidad])` para la v1; no se introduce `id_persona` en este release.
4. El DNI debe ser único dentro de cada parroquia por construcción de la clave compuesta.
5. Ningún sacramento puede registrarse si la persona principal no existe previamente en `Persona`.
6. Toda persona relacionada con un sacramento (padre, madre, padrino, madrina, catequista u otro rol que el modelo requiera) debe existir previamente en `Persona` cuando esa relación sea requerida por el proceso.
7. Bautismo, Primera Comunión, Confirmación y Matrimonio continuarán referenciando Persona mediante `(id_parroquia, numero_identidad)`.
8. La parroquia nunca se recibe como autorización desde el cliente; siempre proviene de la sesión autenticada.
9. Las rutas del CRUD de Personas seguirán operando con el DNI dentro del tenant autenticado: `/api/personas/{numero_identidad}`.
10. No se crearán Personas temporales, anónimas, sin DNI ni identificadores ficticios.

## Flujo funcional obligatorio

```text
Persona existe con DNI
        ↓
Validación de parroquia
        ↓
Puede participar en sacramentos
        ↓
Bautismo / Comunión / Confirmación / Matrimonio / Defunción
```

Si una persona no existe en `Persona`, el flujo debe detenerse y llevar primero al registro de Persona.

## Regla para UI y API

- Los selectores de bautizado, confirmado, cónyuges, padres, padrinos, madrinas y catequistas deben buscar Personas existentes.
- La API sacramental debe volver a validar que cada DNI referenciado existe en la misma parroquia antes de crear el registro.
- La UI no sustituye esta validación del servidor.
- No se permitirá escribir manualmente un DNI en un sacramento para saltarse el catálogo de Personas.

## Grupos y roles parroquiales

- `GrupoParroquial` es un catálogo **global** en v1 (sin `id_parroquia`), conforme al SQL v3 y a la matriz de concordancia. No se le añade `id_parroquia` en v1.
- `RolParroquial` se mantiene como catálogo global en v1.
- El aislamiento por parroquia se aplica en la membresía `TrPersonaGrupoRol`, que conserva `id_parroquia` y FK compuesta hacia Persona.
- Toda membresía requiere una Persona existente en la misma parroquia.

## Defunciones

Se mantiene `Defuncion` dentro del alcance v1 como módulo administrativo parroquial. La persona fallecida deberá existir previamente en `Persona`, identificada por su DNI y parroquia.

## Consecuencias

### Positivas

- Una sola fuente de verdad para todos los datos personales.
- Evita duplicidad de nombres y participantes escritos libremente dentro de sacramentos.
- Simplifica búsqueda integral por DNI.
- Reduce el refactor necesario para llegar a producción en ocho semanas.
- Mantiene compatibilidad con el CRUD de Personas ya construido.

### Restricciones aceptadas

- No se registrarán partidas de personas para las cuales no exista DNI dentro del alcance de v1.
- El alta de Persona es un prerrequisito obligatorio de cualquier proceso sacramental.

## Regla para agentes IA

Ningún agente debe crear un módulo que permita registrar participantes sacramentales fuera de `Persona`. Todo flujo nuevo debe comenzar validando Persona + DNI + `id_parroquia` del contexto autenticado.
