# ADR-001 — Identidad técnica de personas y ministros

**Estado:** Aceptado para ChristiFideles v1.0  
**Fecha:** 2026-08-19  
**Responsables:** Scrum Master / Tech Lead / DBA

## Contexto

El modelo actual utiliza `numero_identidad` (DNI) como parte de la clave primaria de `Persona` y como clave primaria de `OrdenSacerdotal`. Los sacramentos dependen directamente de esos valores.

Esto impide representar correctamente registros históricos donde el DNI no existe, no se conoce o nunca fue consignado en el libro sacramental. También acopla la identidad técnica del registro a un dato civil que puede ser corregido.

## Decisión

1. `Persona` tendrá un identificador técnico `id_persona` (`BigInt`, autoincremental) como clave primaria.
2. `numero_identidad` será un atributo opcional de negocio.
3. Cuando exista DNI, será único dentro de la parroquia mediante `@@unique([id_parroquia, numero_identidad])`.
4. Ninguna relación sacramental utilizará DNI como foreign key. Bautismo, Confirmación, Primera Comunión, Matrimonio y Defunción referenciarán `id_persona`.
5. Padres, padrinos, madrinas y catequistas podrán ser opcionales cuando el registro histórico no contenga esa información.
6. `OrdenSacerdotal` tendrá `id_sacerdote` como clave primaria y `numero_identidad` opcional.
7. Los endpoints y rutas UI usarán IDs técnicos para consultar/editar. El DNI seguirá disponible como criterio de búsqueda.
8. No se generarán DNIs ficticios para completar datos históricos.

## Datos mínimos para persona histórica

Para v1, una persona podrá existir con:

- parroquia;
- nombres;
- apellidos.

Los siguientes campos podrán ser desconocidos/opcionales:

- DNI;
- fecha de nacimiento;
- municipio de nacimiento;
- sexo;
- teléfono;
- dirección;
- sector parroquial;
- orden religiosa.

## Grupos y roles parroquiales

- `GrupoParroquial` será tenant-scoped: pertenece a una parroquia.
- `RolParroquial` se mantiene como catálogo global en v1 (`Coordinador`, `Secretario`, `Miembro`, etc.).
- La membresía debe conservar el `id_parroquia` para asegurar aislamiento y consistencia.

## Defunciones

Se incorpora `Defuncion` como módulo administrativo parroquial de v1, aunque no sea un sacramento. Debe soportar persona, fechas de defunción/exequias, ministro opcional, datos de libro/folio/registro, lugar de sepultura y observaciones.

## Consecuencias

### Positivas

- Soporta libros históricos sin inventar información.
- Permite corregir DNI sin romper relaciones.
- Simplifica relaciones futuras e importaciones masivas.
- Permite búsqueda por DNI sin convertirlo en identidad técnica.

### Costos

- Requiere migrar Prisma y el CRUD actual de Personas.
- Los componentes que hoy utilizan `numero_identidad` como ID deben pasar a `id_persona`.
- Debe existir una migración controlada de datos de desarrollo existentes antes de aplicar el cambio en entornos persistentes.

## Regla para agentes IA

A partir de esta ADR queda prohibido introducir nuevas foreign keys basadas en `numero_identidad`. Todo nuevo módulo debe referenciar IDs técnicos y obtener `id_parroquia` exclusivamente del contexto autenticado cuando aplique.
