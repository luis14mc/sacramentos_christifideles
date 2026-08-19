# Reglas del modelo de datos — ChristiFideles v1.0

Fecha: 2026-08-19

## Objetivo

Consolidar `Persona` como núcleo obligatorio de ChristiFideles, conservar DNI obligatorio y preparar los módulos sacramentales sin introducir un refactor innecesario de claves durante la ventana de ocho semanas.

## Persona — regla central

Para v1 se mantiene el modelo actual:

```prisma
model Persona {
  numero_identidad String
  id_parroquia     Int
  // ...

  @@id([id_parroquia, numero_identidad])
}
```

Reglas:

- No existe Persona sin DNI.
- DNI es obligatorio en API y UI.
- La parroquia proviene exclusivamente de la sesión autenticada.
- No se introduce `id_persona` en v1.
- No se generan DNIs temporales o ficticios.
- El CRUD mantiene `/api/personas/{numero_identidad}` dentro del tenant autenticado.

## Persona primero, módulo después

Antes de registrar cualquier operación funcional se debe validar Persona.

```text
Buscar Persona por DNI
        ↓
¿Existe en la parroquia?
   ├─ No → registrar Persona primero
   └─ Sí → continuar
                    ↓
             módulo funcional
```

Este patrón será obligatorio para Bautismo, Primera Comunión, Confirmación, Matrimonio, Defunción y membresías de grupos.

## Sacramentos

### Bautismo

El bautizado debe existir en `Persona`. Padres, padrinos, madrinas y catequista deberán seleccionarse desde Personas existentes cuando el proceso los requiera. La API vuelve a validar todos los DNIs recibidos contra la misma parroquia.

### Primera Comunión

La persona debe existir previamente. Cualquier padre, madre o catequista asociado debe provenir igualmente de `Persona`.

### Confirmación

El confirmado debe existir previamente. Padres, padrinos, madrinas y catequista se resuelven desde `Persona`.

### Matrimonio

Esposo y esposa deben existir previamente en `Persona`. Los familiares y padrinos asociados deben resolverse desde Personas existentes.

## Defunciones

Se incorpora `Defuncion` a v1. La persona fallecida debe existir previamente en `Persona`.

Campos iniciales previstos:

- `id_defuncion`
- `id_parroquia`
- `numero_identidad_persona`
- `numero_identidad_sacerdote` cuando aplique
- `fecha_defuncion`
- `fecha_exequias`
- `lugar_sepultura`
- `numero_libro`
- `numero_folio`
- `numero_pagina`
- `numero_registro`
- `observaciones`

## Ministros

Para v1 no se hará un refactor general de `OrdenSacerdotal` a `id_sacerdote`. Se conserva el modelo existente mientras sea compatible con las reglas funcionales y el CI. Cualquier cambio posterior debe justificarse por una necesidad real del piloto.

## Grupos

- `GrupoParroquial` debe pertenecer a una parroquia (`id_parroquia`).
- `RolParroquial` permanece global en v1.
- La membresía siempre apunta a una Persona existente en la misma parroquia.

## Validaciones obligatorias del servidor

Una API sacramental no puede confiar únicamente en el selector de frontend. Antes de insertar debe comprobar:

1. sesión autenticada;
2. permiso RBAC correspondiente;
3. `id_parroquia` desde sesión;
4. existencia de cada Persona referenciada mediante `(id_parroquia, numero_identidad)`;
5. consistencia de referencias registrales;
6. ausencia de acceso cruzado entre parroquias.

## Gates obligatorios

- `npx prisma validate`
- `npx prisma generate`
- PostgreSQL CI
- `npm run lint`
- `npm run build`
- no permite crear Persona sin DNI
- no permite sacramento con persona inexistente
- no permite usar Persona de otra parroquia
- aislamiento Parroquia A/B
- RBAC por operación

## Definition of Done

El modelo base de v1 se considera listo cuando Persona funciona como fuente única de verdad y ninguna entidad funcional puede saltarse ese núcleo para crear participantes o registros sacramentales.
